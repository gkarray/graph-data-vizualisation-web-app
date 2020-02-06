from django.shortcuts import render
from django.urls import reverse
from .models import Visualization
from .forms import GenerateForm
import os
from django.core.files import File
from graphs import convert
from django.conf import settings
from django.views.generic import CreateView, DetailView, ListView, FormView

# Create your views here.
def homeview(request):
    return render(request, 'home.html', {})

class importview(CreateView):
    model = Visualization
    fields = [
        'Name',
        'Data'#,
        #'BFS'
    ]
    template_name = 'import.html'

class generateView(FormView):
    template_name = 'generate.html'
    form_class = GenerateForm
    index = -1

    def form_valid(self, form):
        name = form.cleaned_data['name']
        nbNodes = form.cleaned_data['nbNodes']
        maxWeight = form.cleaned_data['maxWeight']
        chance = form.cleaned_data['chance']

        print("the following is " + name + " " + str(nbNodes) + " / " + str(maxWeight) + " / " + str(chance))
        fileName = name + "(Random" + str(nbNodes)+").csv"
        pathName = os.path.join("temp", fileName)
        convert.generateRandomMatrix(os.path.join(settings.MEDIA_ROOT, pathName), nbNodes, chance, maxWeight)
        f = open(os.path.join(settings.MEDIA_ROOT, pathName))

        myFile = File(f)
        p = Visualization(Name=name, Data=myFile)
        p.Data.name = fileName
        p.save()

        self.index = p.pk

        f.close()

        os.remove(os.path.join(settings.MEDIA_ROOT, pathName))


        return super().form_valid(form)

    def get_success_url(self):
        return reverse('visual', kwargs={'pk': self.index})

class matrixView(DetailView):
    model = Visualization
    context_object_name = 'jsonFile'
    template_name = 'matrix.html'

class node_linkView(DetailView):
    model = Visualization
    context_object_name = 'jsonFile'
    template_name = 'node-link.html'

class historyView(ListView):
    model = Visualization
    template_name = 'history.html'
    context_object_name = 'fileList'

class visualView(DetailView):
    model = Visualization
    context_object_name = 'jsonFile'
    template_name = 'visual.html'