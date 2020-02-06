# GraphViz

Repo for the GraphViz website (https://dbl-hti.cyanworks.nl/).

## Prerequisites:
- Have Python installed
- Have the following packages installed: Pandas, Numpy, SciPy, Django, Crispy-forms

## Installation
After installing the packages and activating your virtual enviorment, run the following commands

``` 
cd DBL_HTI/djangoproject
python manage.py makemigrations --merge 
python manage.py migrate
python manage.py runserver
``` 

You should now have the website hosted on http://127.0.0.1:8000/

## Usage
To start using the website you can either upload a csv file, or go to the generate page and generate a data set over there.

To view previously imported/generated pages go to the history page

Large graphs with a high density, the node-link diagram can cause lowered performace. 

Node-link diagrams need to be enabled first, the matrix should render automatically.

The linking between the matrix and the node-link is always present on the "view both" page, this can be verified by the "source" and "target" fields above the matrix. For optimal visual results it is suggested to enable highlighting.
