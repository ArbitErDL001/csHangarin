from django.urls import path

from . import views


app_name = 'app'

urlpatterns = [
    path('', views.task_list, name='task_list'),
]
