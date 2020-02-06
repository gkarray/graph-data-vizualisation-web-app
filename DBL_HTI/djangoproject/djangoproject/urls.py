"""djangoproject URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from visualization import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.homeview),
    path('home/', views.homeview, name='home'),
    path('import/', views.importview.as_view(), name='import'),
    path('history/<slug:pk>', views.visualView.as_view(), name='visual'),
    path('history/matrix/<slug:pk>', views.matrixView.as_view(), name='matrix'),
    path('history/node-link/<slug:pk>', views.node_linkView.as_view(), name='node-link'),
    path('history/', views.historyView.as_view(), name ='history'),
    path('generate/', views.generateView.as_view(), name='generate'),
    path('admin/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)