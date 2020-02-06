from django import forms


class GenerateForm(forms.Form):
    name = forms.CharField(max_length=20, label="Name your dataset :")
    nbNodes = forms.IntegerField(min_value=0, max_value=2000, label="Amount of nodes (0-2000):")
    maxWeight = forms.IntegerField(min_value=1, max_value=100, label="Maximum weight of an edge (1-100):")
    chance = forms.FloatField(min_value=0, max_value=1, label="Chance of an edge [0,1]:")

    chance.widget.attrs.update({'step': 0.001})