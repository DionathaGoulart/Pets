from django.urls import path
from . import views

urlpatterns = [
    path('api/profile/', views.user_profile, name='user-profile'),
    path('api/profile/update/', views.update_profile, name='update-profile'),
    path('api/dashboard/', views.dashboard, name='dashboard'),
]