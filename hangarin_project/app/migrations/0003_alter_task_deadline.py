from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_task_is_deleted'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='deadline',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]