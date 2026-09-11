from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from app.models import Category, Note, Priority, SubTask, Task


class Command(BaseCommand):
    help = 'Create sample Categories, Priorities, Tasks, SubTasks, and Notes with Faker.'

    category_names = ('Work', 'School', 'Personal', 'Finance', 'Projects')
    priority_names = ('Critical', 'High', 'Medium', 'Low', 'Optional')

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of records to create for each tab (default: 5).',
        )
        parser.add_argument(
            '--additional',
            action='store_true',
            help='Create new unique Categories and Priorities instead of reusing the standard five.',
        )

    def handle(self, *args, **options):
        count = options['count']
        if count < 1:
            self.stderr.write(self.style.ERROR('--count must be at least 1.'))
            return

        faker = Faker()
        if options['additional']:
            categories = [
                Category.objects.create(name=faker.unique.word().title())
                for _ in range(count)
            ]
            priorities = [
                Priority.objects.create(name=faker.unique.word().title())
                for _ in range(count)
            ]
        else:
            categories = [
                Category.objects.get_or_create(name=name)[0]
                for name in self.category_names[:count]
            ]
            priorities = [
                Priority.objects.get_or_create(name=name)[0]
                for name in self.priority_names[:count]
            ]

        tasks = [
            Task.objects.create(
                title=faker.sentence(nb_words=6).rstrip('.'),
                description=faker.paragraph(),
                status=faker.random_element(elements=Task.Status.values),
                deadline=self.make_deadline(faker),
                category=faker.random_element(elements=categories),
                priority=faker.random_element(elements=priorities),
            )
            for _ in range(count)
        ]

        SubTask.objects.bulk_create([
            SubTask(
                task=faker.random_element(elements=tasks),
                title=faker.sentence(nb_words=5).rstrip('.'),
                status=faker.boolean(),
            )
            for _ in range(count)
        ])

        Note.objects.bulk_create([
            Note(
                task=faker.random_element(elements=tasks),
                content=faker.paragraph(),
            )
            for _ in range(count)
        ])

        self.stdout.write(self.style.SUCCESS(
            f'Created {len(categories)} categories, {len(priorities)} priorities, '
            f'{len(tasks)} tasks, {count} subtasks, and {count} notes.'
        ))

    @staticmethod
    def make_deadline(faker):
        generated = faker.date_time_this_month()
        if timezone.is_naive(generated):
            generated = timezone.make_aware(generated)
        return generated
