from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import TestCase


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

	def test_signup_redirects_to_login_without_email_delivery(self):
		response = self.client.post(
			reverse('account_signup'),
			{
				'username': 'newuser',
				'email': 'newuser@example.com',
				'password1': 'Strong-password-123!',
				'password2': 'Strong-password-123!',
			},
		)

		self.assertRedirects(response, reverse('account_login'), fetch_redirect_response=False)
		self.assertTrue(get_user_model().objects.filter(username='newuser').exists())
		self.assertNotIn('_auth_user_id', self.client.session)
