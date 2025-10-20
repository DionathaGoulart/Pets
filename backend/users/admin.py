from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from allauth.socialaccount.models import SocialAccount
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'account_type', 'email_verified', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informações Pessoais', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    
    def account_type(self, obj):
        """Mostra se o usuário tem conta social ou normal"""
        from allauth.account.models import EmailAddress
        
        social_accounts = SocialAccount.objects.filter(user=obj)
        if social_accounts.exists():
            providers = ', '.join([acc.provider.title() for acc in social_accounts])
            return format_html('🔗 <b>{}</b>', providers)
        return format_html('📧 Email/Senha')
    
    account_type.short_description = 'Tipo de Conta'
    
    def email_verified(self, obj):
        """Mostra se o email está verificado"""
        from allauth.account.models import EmailAddress
        
        email_obj = EmailAddress.objects.filter(user=obj, email__iexact=obj.email).first()
        if email_obj and email_obj.verified:
            return format_html('<span style="color: green;">✅ Verificado</span>')
        return format_html('<span style="color: red;">❌ Não verificado</span>')
    
    email_verified.short_description = 'Email'