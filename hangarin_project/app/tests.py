from io import BytesIO
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.test import TestCase
from django.test.utils import override_settings
from PIL import Image

from .models import Profile, Task


class LoginPageTests(TestCase):
	def test_service_worker_endpoint_returns_javascript(self):
		response = self.client.get('/serviceworker.js')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response['Content-Type'], 'application/javascript')

	def test_login_page_renders_without_social_apps(self):
		response = self.client.get(reverse('account_login'))

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Continue with Google')
		self.assertContains(response, 'Continue with GitHub')

	def test_auth_pages_include_pwa_metadata(self):
		for page_name in ('account_login', 'account_signup'):
			with self.subTest(page_name=page_name):
				response = self.client.get(reverse(page_name))
				self.assertEqual(response.status_code, 200)
				self.assertContains(response, 'manifest.json')
				self.assertContains(response, 'serviceworker.js')

	def test_login_redirects_authenticated_user_to_home(self):
		get_user_model().objects.create_user(
			username='aedl',
			password='aedl pass',
		)

		response = self.client.post(
			reverse('account_login'),
			{'login': 'aedl', 'password': 'aedl pass'},
			follow=True,
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.request['PATH_INFO'], reverse('home'))
		self.assertContains(response, 'Successfully signed in as')
		self.assertContains(response, 'Dashboard')

	def test_signup_redirects_to_dashboard_without_email_delivery(self):
		response = self.client.post(
			reverse('account_signup'),
			{
				'username': 'newuser',
				'email': 'newuser@example.com',
				'password1': 'Strong-password-123!',
				'password2': 'Strong-password-123!',
			},
		)

		self.assertRedirects(response, reverse('home'), fetch_redirect_response=False)
		self.assertTrue(get_user_model().objects.filter(username='newuser').exists())
		self.assertIn('_auth_user_id', self.client.session)


class ProfilePageTests(TestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username='profileuser',
			password='profile pass',
		)

	def test_profile_pages_require_authentication(self):
		for page_name in ('profile', 'profile-edit'):
			response = self.client.get(reverse(page_name))
			self.assertEqual(response.status_code, 302)
			self.assertIn(reverse('account_login'), response['Location'])

	def test_profile_shows_workspace_progress_and_recent_tasks(self):
		self.client.force_login(self.user)
		Task.objects.create(title='Completed task', status=Task.Status.DONE)
		Task.objects.create(title='Active task', status=Task.Status.IN_PROGRESS)
		Task.objects.create(title='Deleted task', is_deleted=True)

		response = self.client.get(reverse('profile'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.context['workspace_task_count'], 2)
		self.assertEqual(response.context['workspace_completed_count'], 1)
		self.assertEqual(response.context['completion_rate'], 50)
		self.assertContains(response, 'Completed task')
		self.assertContains(response, 'Active task')
		self.assertNotContains(response, 'Deleted task')
		self.assertContains(response, 'shared across accounts')

	def test_profile_edit_updates_only_account_fields(self):
		self.client.force_login(self.user)
		response = self.client.get(reverse('profile-edit'))
		self.assertEqual(
			set(response.context['form'].fields),
			{'username', 'first_name', 'last_name', 'email'},
		)

		response = self.client.post(reverse('profile-edit'), {
			'username': 'updateduser',
			'first_name': 'Updated',
			'last_name': 'User',
			'email': 'updated@example.com',
		})

		self.assertRedirects(response, reverse('profile'))
		self.user.refresh_from_db()
		self.assertEqual(self.user.username, 'updateduser')
		self.assertEqual(self.user.first_name, 'Updated')
		self.assertEqual(self.user.last_name, 'User')
		self.assertEqual(self.user.email, 'updated@example.com')

	def test_profile_picture_upload_is_saved(self):
		self.client.force_login(self.user)
		image_data = BytesIO()
		Image.new('RGB', (2, 2), color='teal').save(image_data, format='PNG')
		image_upload = SimpleUploadedFile(
			'avatar.png',
			image_data.getvalue(),
			content_type='image/png',
		)

		with tempfile.TemporaryDirectory() as media_root:
			with override_settings(MEDIA_ROOT=media_root):
				response = self.client.post(reverse('profile-edit'), {
					'username': self.user.username,
					'first_name': '',
					'last_name': '',
					'email': '',
					'avatar': image_upload,
				})
				self.assertRedirects(response, reverse('profile'))
				profile = Profile.objects.get(user=self.user)
				self.assertTrue(profile.avatar.name.startswith('profile_pictures/'))
				self.assertTrue(profile.avatar.storage.exists(profile.avatar.name))
				profile_page = self.client.get(reverse('profile'))
				self.assertContains(profile_page, profile.avatar.url)

	def test_profile_picture_rejects_invalid_image_content(self):
		self.client.force_login(self.user)
		invalid_upload = SimpleUploadedFile(
			'not-an-image.png',
			b'not an image',
			content_type='image/png',
		)

		response = self.client.post(reverse('profile-edit'), {
			'username': self.user.username,
			'first_name': '',
			'last_name': '',
			'email': '',
			'avatar': invalid_upload,
		})

		self.assertEqual(response.status_code, 200)
		self.assertIn('avatar', response.context['picture_form'].errors)


class SettingsPageTests(TestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username='settingsuser',
			password='settings pass',
		)

	def test_settings_page_requires_authentication(self):
		response = self.client.get(reverse('settings'))

		self.assertEqual(response.status_code, 302)
		self.assertIn(reverse('account_login'), response['Location'])

	def test_settings_page_lists_all_themes(self):
		self.client.force_login(self.user)
		response = self.client.get(reverse('settings'))

		self.assertEqual(response.status_code, 200)
		for theme in ('nebula', 'forest', 'desert', 'sea', 'crimson', 'light'):
			self.assertContains(response, f'data-theme="{theme}"')
