from django.db import models
from django.urls import reverse
from django.core.validators import FileExtensionValidator
from django.conf import settings
from django.utils import timezone

from graphs import convert
from . import func
import os

# Create your models here.
class Visualization(models.Model):
    Name = models.CharField(max_length=50, default='')
    Data = models.FileField(upload_to='visual/', validators=[FileExtensionValidator(['csv','json'])])
    Date = models.DateField(default=timezone.now)
    EdgeCount = models.IntegerField(default=0)
    NodeCount = models.IntegerField(default=0)
    GraphDensity = models.IntegerField(default=0)

    def save(self):
        super(Visualization, self).save()
        
        name = self.Data.name
        initial_path = os.path.join(settings.MEDIA_ROOT, name)
        if '.csv' in name:
            name = func.name_ext(name, '.json')
            self.Data.name = name
            new_path = os.path.join(settings.MEDIA_ROOT, name)
            #if self.BFS == True:
            graphInfo = convert.convertGraph(initial_path, new_path, 'y')
            self.EdgeCount = graphInfo["edges"];
            self.NodeCount = graphInfo["nodes"];
            self.GraphDensity = graphInfo["edges"] / graphInfo["nodes"];
            #else:
            #    convert.convertGraph(initial_path, new_path, 'n')
        else:
            #if self.BFS == True:
            convert.convertJson(initial_path, initial_path, 'y')
            # else:
            #     convert.convertJson(initial_path, initial_path, 'r')
        
        super(Visualization, self).save()

    def get_absolute_url(self):
        return reverse('visual', kwargs={'pk': self.pk})

    def delete(self):
        func.remove(settings.MEDIA_ROOT, self.Data.name)
        super(Visualization, self).delete()