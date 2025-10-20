from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
        # Herda de AbstractUser (já tem username, email, password, etc)
    
    def __str__(self):
        return self.username