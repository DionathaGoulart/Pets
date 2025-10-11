from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # Aqui você pode adicionar campos personalizados
    # Por exemplo:
    # phone = models.CharField(max_length=20, blank=True)
    # birth_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return self.username