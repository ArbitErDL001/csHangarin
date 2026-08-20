from django.shortcuts import render

from .models import Task


def task_list(request):
	tasks = Task.objects.select_related('priority', 'category').prefetch_related('subtasks')
	return render(request, 'app/task_list.html', {'tasks': tasks})
