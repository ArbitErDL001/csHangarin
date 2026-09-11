from django import forms

from .models import Category, Note, Priority, SubTask, Task


class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ('title', 'description', 'status', 'deadline', 'priority', 'category')
        widgets = {
            'deadline': forms.DateInput(attrs={'type': 'date'}),
            'description': forms.Textarea(attrs={'rows': 5}),
        }


class SubTaskForm(forms.ModelForm):
    class Meta:
        model = SubTask
        fields = ('task', 'title', 'status')


class NoteForm(forms.ModelForm):
    class Meta:
        model = Note
        fields = ('task', 'content')


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ('name',)


class PriorityForm(forms.ModelForm):
    class Meta:
        model = Priority
        fields = ('name',)