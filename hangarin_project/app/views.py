from django.shortcuts import get_object_or_404, redirect, render

from .forms import TaskForm
from .models import Task


def home(request):
	tasks = Task.objects.select_related('priority', 'category').prefetch_related('subtasks')
	return render(request, 'app/home.html', {
		'tasks': tasks,
		'in_progress_count': tasks.filter(status=Task.Status.IN_PROGRESS).count(),
		'done_count': tasks.filter(status=Task.Status.DONE).count(),
	})


def manage_task(request, task_id=None):
	task = get_object_or_404(Task, pk=task_id) if task_id else None
	if request.method == 'POST':
		form = TaskForm(request.POST, instance=task)
		if form.is_valid():
			form.save()
			return redirect('app:home')
	else:
		form = TaskForm(instance=task)
	return render(request, 'app/manage.html', {'form': form, 'task': task})


def delete_task(request, task_id):
	task = get_object_or_404(Task, pk=task_id)
	if request.method == 'POST':
		task.delete()
		return redirect('app:home')
	return render(request, 'app/manage.html', {'task': task, 'confirm_delete': True})
