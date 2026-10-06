"""
URL configuration for hangarin_project project.

The `urlpatterns` list routes URLs to views.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # PWA endpoints must precede the app's service-worker route.
    path('', include('pwa.urls')),

    # Django Allauth
    path('accounts/', include('allauth.urls')),

    # Your Hangarin application
    path('', include('app.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)