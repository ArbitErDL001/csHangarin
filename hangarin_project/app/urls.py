from django.urls import path
from . import views

urlpatterns = [
    path('serviceworker.js', views.service_worker, name='service-worker'),
    path('', views.home, name='home'),

    path('tasks/', views.TaskListView.as_view(), name='task-list'),
    path('tasks/add/', views.TaskCreateView.as_view(), name='task-add'),
    path('tasks/<int:pk>/edit/', views.TaskUpdateView.as_view(), name='task-edit'),
    path('tasks/<int:pk>/delete/', views.TaskDeleteView.as_view(), name='task-delete'),
    path('tasks/<int:pk>/done/', views.mark_task_done, name='task-done'),

    path('subtasks/', views.SubTaskListView.as_view(), name='subtask-list'),
    path('subtasks/add/', views.SubTaskCreateView.as_view(), name='subtask-add'),
    path('subtasks/<int:pk>/edit/', views.SubTaskUpdateView.as_view(), name='subtask-edit'),
    path('subtasks/<int:pk>/delete/', views.SubTaskDeleteView.as_view(), name='subtask-delete'),
    path('subtasks/<int:pk>/done/', views.mark_subtask_done, name='subtask-done'),

    path('notes/', views.NoteListView.as_view(), name='note-list'),
    path('notes/add/', views.NoteCreateView.as_view(), name='note-add'),
    path('notes/<int:pk>/edit/', views.NoteUpdateView.as_view(), name='note-edit'),
    path('notes/<int:pk>/delete/', views.NoteDeleteView.as_view(), name='note-delete'),

    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/add/', views.CategoryCreateView.as_view(), name='category-add'),
    path('categories/<int:pk>/edit/', views.CategoryUpdateView.as_view(), name='category-edit'),
    path('categories/<int:pk>/delete/', views.CategoryDeleteView.as_view(), name='category-delete'),

    path('priorities/', views.PriorityListView.as_view(), name='priority-list'),
    path('priorities/add/', views.PriorityCreateView.as_view(), name='priority-add'),
    path('priorities/<int:pk>/edit/', views.PriorityUpdateView.as_view(), name='priority-edit'),
    path('priorities/<int:pk>/delete/', views.PriorityDeleteView.as_view(), name='priority-delete'),
]