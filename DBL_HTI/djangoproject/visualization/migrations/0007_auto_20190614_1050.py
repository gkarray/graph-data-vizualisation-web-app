# Generated by Django 2.2 on 2019-06-14 10:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('visualization', '0006_merge_20190614_1049'),
    ]

    operations = [
        migrations.AddField(
            model_name='visualization',
            name='EdgeCount',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='visualization',
            name='NodeCount',
            field=models.IntegerField(default=0),
        ),
    ]