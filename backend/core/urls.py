from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Endpoints de autenticação
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/auth/google/', include('allauth.socialaccount.providers.google.urls')),
    
    # Endpoints dos usuários
    path('', include('users.urls')),
]