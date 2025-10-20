from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from allauth.account.models import EmailAddress
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """Serializer para detalhes do usuário"""
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)


class CustomRegisterSerializer(RegisterSerializer):
    """
    Serializer customizado para registro que valida email e username
    """
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, email):
        """
        Valida se o email já está sendo usado
        """
        email = email.lower()
        
        # Verifica User e EmailAddress (contas sociais)
        user_exists = CustomUser.objects.filter(email__iexact=email).exists()
        social_exists = EmailAddress.objects.filter(email__iexact=email).exists()
        
        if user_exists or social_exists:
            raise serializers.ValidationError(
                "Este email já está sendo usado. "
                "Se você já tem uma conta, faça login."
            )
        
        return email

    def validate_username(self, username):
        """Valida se o username já existe"""
        if CustomUser.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError(
                "Este nome de usuário já está sendo usado."
            )
        return username

    def get_cleaned_data(self):
        """Retorna os dados limpos incluindo first_name e last_name"""
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        return data

    def save(self, request):
        """Salva o usuário com os dados adicionais"""
        user = super().save(request)
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.save()
        return user