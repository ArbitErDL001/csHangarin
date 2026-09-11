# csHangarin

## Social login setup

Google, Facebook, and GitHub login providers are enabled through Django Allauth. To make their buttons appear and activate OAuth login:

1. Create a superuser with `py manage.py createsuperuser` from `hangarin_project`.
2. Open `/admin/` and create a Social application for each provider.
3. Set the Site to the project's current site and enter each provider's client ID and secret.
4. Add these callback URLs to the provider dashboards:
	- `http://127.0.0.1:8000/accounts/google/login/callback/`
	- `http://127.0.0.1:8000/accounts/facebook/login/callback/`
	- `http://127.0.0.1:8000/accounts/github/login/callback/`

The login page intentionally hides providers without a configured Social application, so local username/password login continues to work before OAuth credentials are added.