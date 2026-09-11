from django.db.models import Q
from django.shortcuts import render
from django.views.generic import CreateView, DeleteView, ListView, UpdateView

from .forms import CategoryForm, NoteForm, PriorityForm, SubTaskForm, TaskForm
from .models import Category, Note, Priority, SubTask, Task


def home(request):
	return render(request, 'home.html', {
		'categories_count': Category.objects.count(),
		'priorities_count': Priority.objects.count(),
		'subtasks_count': SubTask.objects.count(),
		'tasks_count': Task.objects.count(),
		'notes_count': Note.objects.count(),
	})


class SearchSortListView(ListView):
	paginate_by = 10
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


class TaskDeleteView(DeleteView):
	model = Task
	template_name = 'hangarin/task_confirm_delete.html'
	success_url = '/tasks/'


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


class SubTaskDeleteView(DeleteView):
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


class NoteDeleteView(DeleteView):
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


class CategoryDeleteView(DeleteView):
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


class PriorityDeleteView(DeleteView):
	model = Priority
	template_name = 'hangarin/priority_confirm_delete.html'
	success_url = '/priorities/'
