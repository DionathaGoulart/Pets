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
    Serializer customizado para registro que verifica se o email
    já está sendo usado (incluindo contas sociais)
    """
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, email):
        """
        Valida se o email já está sendo usado
        Verifica tanto em User quanto em EmailAddress (para contas sociais)
        """
        email = email.lower()
        
        # Verifica se já existe um usuário com esse email
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Este email já está sendo usado. Se você criou uma conta com Google, "
                "faça login com o Google."
            )
        
        # Verifica se o email está registrado via conta social
        if EmailAddress.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Este email já está associado a uma conta social (Google). "
                "Por favor, faça login com o Google."
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