from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.user_profile, name='user-profile'),
    path('profile/update/', views.update_profile, name='update-profile'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('auth/google/callback/', views.google_auth, name='google-auth'),
]