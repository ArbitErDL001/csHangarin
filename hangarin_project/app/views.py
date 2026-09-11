from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.generic import CreateView, DeleteView, ListView, UpdateView

from .forms import CategoryForm, NoteForm, PriorityForm, SubTaskForm, TaskForm
from .models import Category, Note, Priority, SubTask, Task


def service_worker(request):
	return HttpResponse(
		"self.addEventListener('install', function () { self.skipWaiting(); });\n"
		"self.addEventListener('activate', function (event) {"
		" event.waitUntil(self.clients.claim());"
		"});\n",
		content_type='application/javascript',
	)


def user_data_deletion(request):
	if request.method == 'POST':
		return JsonResponse({
			'url': request.build_absolute_uri('/user-data-deletion/'),
			'confirmation_code': 'HANGARIN-DATA-REQUEST',
		})
	return render(request, 'legal/user_data_deletion.html')


def home(request):
	if not request.user.is_authenticated:
		return redirect('account_login')

	active_tasks = Task.objects.filter(is_deleted=False)
	archive_items = [
		{'status': 'Deleted', 'title': task.title, 'subtitle': ''}
		for task in Task.objects.filter(is_deleted=True)
	]
	archive_items.extend(
		{'status': 'Done', 'title': task.title, 'subtitle': ''}
		for task in active_tasks.filter(status=Task.Status.DONE)
	)
	archive_items.extend(
		{'status': 'Subtask done', 'title': subtask.title, 'subtitle': subtask.task.title}
		for subtask in SubTask.objects.filter(status=True).select_related('task')
	)
	archive_paginator = Paginator(archive_items, 5)
	archive_page = archive_paginator.get_page(request.GET.get('archive_page', 1))
	return render(request, 'home.html', {
		'categories_count': Category.objects.count(),
		'priorities_count': Priority.objects.count(),
		'subtasks_count': SubTask.objects.count(),
		'tasks_count': active_tasks.count(),
		'notes_count': Note.objects.count(),
		'archive_items': archive_page.object_list,
		'archive_page_obj': archive_page,
		'archive_paginator': archive_paginator,
		'archive_is_paginated': archive_page.has_other_pages(),
	})


def redirect_to_next(request, default):
	return_url = request.POST.get('next') or request.GET.get('next')
	if return_url and url_has_allowed_host_and_scheme(
		return_url,
		allowed_hosts={request.get_host()},
		require_https=request.is_secure(),
	):
		return redirect(return_url)
	return redirect(default)


@require_POST
def mark_task_done(request, pk):
	task = get_object_or_404(Task, pk=pk, is_deleted=False)
	task.status = Task.Status.DONE
	task.save(update_fields=('status', 'updated_at'))
	return redirect_to_next(request, '/tasks/')


@require_POST
def mark_subtask_done(request, pk):
	subtask = get_object_or_404(SubTask, pk=pk)
	subtask.status = True
	subtask.save(update_fields=('status',))
	return redirect_to_next(request, '/subtasks/')


class SearchSortListView(ListView):
	paginate_by = 5
	search_fields = ()
	allowed_sort_fields = ()
	default_sort = 'name'

	def get_queryset(self):
		queryset = self.model.objects.all()
		query = self.request.GET.get('q', '').strip()
		if query:
			search = Q()
			for field in self.search_fields:
				search |= Q(**{f'{field}__icontains': query})
			queryset = queryset.filter(search)
		sort_by = self.request.GET.get('sort_by', self.default_sort)
		if sort_by not in self.allowed_sort_fields:
			sort_by = self.default_sort
		self.sort_by = sort_by
		return queryset.order_by(sort_by)

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context['q'] = self.request.GET.get('q', '')
		context['sort_by'] = self.sort_by
		return context


class TaskListView(SearchSortListView):
	model = Task
	template_name = 'hangarin/task_list.html'
	context_object_name = 'tasks'
	search_fields = ('title', 'description')
	allowed_sort_fields = ('title', 'status', 'deadline', 'priority__name', 'category__name', 'created_at', '-created_at')
	default_sort = 'category__name'

	def get_queryset(self):
		return super().get_queryset().filter(is_deleted=False)


class SubTaskListView(SearchSortListView):
	model = SubTask
	template_name = 'hangarin/subtask_list.html'
	context_object_name = 'subtasks'
	search_fields = ('title', 'task__title')
	allowed_sort_fields = ('task__title', 'title', 'status')
	default_sort = 'task__title'


class NoteListView(SearchSortListView):
	model = Note
	template_name = 'hangarin/note_list.html'
	context_object_name = 'notes'
	search_fields = ('content', 'task__title')
	allowed_sort_fields = ('task__title', 'content', 'created_at', '-created_at')
	default_sort = '-created_at'


class CategoryListView(SearchSortListView):
	model = Category
	template_name = 'hangarin/category_list.html'
	context_object_name = 'categories'
	search_fields = ('name',)
	allowed_sort_fields = ('name',)


class PriorityListView(SearchSortListView):
	model = Priority
	template_name = 'hangarin/priority_list.html'
	context_object_name = 'priorities'
	search_fields = ('name',)
	allowed_sort_fields = ('name',)


class TaskCreateView(CreateView):
	model = Task
	form_class = TaskForm
	template_name = 'hangarin/task_form.html'
	success_url = '/tasks/'


class TaskUpdateView(UpdateView):
	model = Task
	form_class = TaskForm
	template_name = 'hangarin/task_form.html'
	success_url = '/tasks/'


class ReturnToTabDeleteMixin:
	def get_success_url(self):
		return_url = self.request.POST.get('next') or self.request.GET.get('next')
		if return_url and url_has_allowed_host_and_scheme(
			return_url,
			allowed_hosts={self.request.get_host()},
			require_https=self.request.is_secure(),
		):
			return return_url
		return super().get_success_url()

	def form_valid(self, form):
		try:
			self.object.delete()
		except ProtectedError:
			messages.error(
				self.request,
				f'"{self.object}" cannot be deleted because it is still used by another item.',
			)
		return redirect(self.get_success_url())

		return redirect(self.get_success_url())


class TaskDeleteView(ReturnToTabDeleteMixin, DeleteView):
	model = Task
	template_name = 'hangarin/task_confirm_delete.html'
	success_url = '/tasks/'

	def form_valid(self, form):
		self.object.is_deleted = True
		self.object.save(update_fields=('is_deleted', 'updated_at'))
		return redirect(self.get_success_url())


class SubTaskCreateView(CreateView):
	model = SubTask
	form_class = SubTaskForm
	template_name = 'hangarin/subtask_form.html'
	success_url = '/subtasks/'


class SubTaskUpdateView(UpdateView):
	model = SubTask
	form_class = SubTaskForm
	template_name = 'hangarin/subtask_form.html'
	success_url = '/subtasks/'


class SubTaskDeleteView(ReturnToTabDeleteMixin, DeleteView):
	model = SubTask
	template_name = 'hangarin/subtask_confirm_delete.html'
	success_url = '/subtasks/'


class NoteCreateView(CreateView):
	model = Note
	form_class = NoteForm
	template_name = 'hangarin/note_form.html'
	success_url = '/notes/'


class NoteUpdateView(UpdateView):
	model = Note
	form_class = NoteForm
	template_name = 'hangarin/note_form.html'
	success_url = '/notes/'


class NoteDeleteView(ReturnToTabDeleteMixin, DeleteView):
	model = Note
	template_name = 'hangarin/note_confirm_delete.html'
	success_url = '/notes/'


class CategoryCreateView(CreateView):
	model = Category
	form_class = CategoryForm
	template_name = 'hangarin/category_form.html'
	success_url = '/categories/'


class CategoryUpdateView(UpdateView):
	model = Category
	form_class = CategoryForm
	template_name = 'hangarin/category_form.html'
	success_url = '/categories/'


class CategoryDeleteView(ReturnToTabDeleteMixin, DeleteView):
	model = Category
	template_name = 'hangarin/category_confirm_delete.html'
	success_url = '/categories/'


class PriorityCreateView(CreateView):
	model = Priority
	form_class = PriorityForm
	template_name = 'hangarin/priority_form.html'
	success_url = '/priorities/'


class PriorityUpdateView(UpdateView):
	model = Priority
	form_class = PriorityForm
	template_name = 'hangarin/priority_form.html'
	success_url = '/priorities/'


class PriorityDeleteView(ReturnToTabDeleteMixin, DeleteView):
	model = Priority
	template_name = 'hangarin/priority_confirm_delete.html'
	success_url = '/priorities/'
