from django.urls import path

from . import views


app_name = 'app'

urlpatterns = [
    path('', views.home, name='home'),
    path('manage/', views.manage_task, name='create_task'),
    path('manage/<int:task_id>/', views.manage_task, name='edit_task'),
    path('manage/<int:task_id>/delete/', views.delete_task, name='delete_task'),
]
