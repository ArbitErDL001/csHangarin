"""
URL configuration for hangarin_project project.

The `urlpatterns` list routes URLs to views.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # Django Allauth
    path('accounts/', include('allauth.urls')),

    # Your Hangarin application
    path('', include('app.urls')),
]