from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount, SocialToken
import requests
from decouple import config
from .serializers import UserSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Retorna os dados do usuário autenticado
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Atualiza os dados do usuário autenticado
    """
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """
    Endpoint do dashboard - retorna dados do usuário e outras informações
    """
    user_data = UserSerializer(request.user).data
    
    # Aqui você pode adicionar mais dados que quer retornar
    data = {
        'user': user_data,
        'message': f'Bem-vindo ao dashboard, {request.user.username}!',
        # Adicione outros dados que você queira retornar
    }
    
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Endpoint para autenticação via Google OAuth
    Cria/atualiza usuário e registra a conta social
    """
    try:
        code = request.data.get('code')
        redirect_uri = request.data.get('redirect_uri')
        
        if not code:
            return Response(
                {'error': 'Código de autorização não fornecido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Troca o código por um access token do Google
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'client_id': config('GOOGLE_CLIENT_ID'),
            'client_secret': config('GOOGLE_SECRET'),
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
        }
        
        token_response = requests.post(token_url, data=token_data)
        
        if token_response.status_code != 200:
            return Response(
                {'error': 'Falha ao obter token do Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token_json = token_response.json()
        access_token = token_json.get('access_token')
        refresh_token = token_json.get('refresh_token', '')  # Pode não vir sempre
        expires_in = token_json.get('expires_in', 3600)
        
        if not access_token:
            return Response(
                {'error': 'Token de acesso não recebido do Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtém informações do usuário do Google
        user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        user_response = requests.get(
            user_info_url, 
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_response.status_code != 200:
            return Response(
                {'error': 'Falha ao obter informações do usuário'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_info = user_response.json()
        email = user_info.get('email')
        google_id = user_info.get('id')
        name = user_info.get('name', '')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        
        if not email:
            return Response(
                {'error': 'Email não fornecido pelo Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not google_id:
            return Response(
                {'error': 'ID do Google não fornecido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        User = get_user_model()
        
        # Verifica se já existe conta Google pelo UID (ID único)
        social_account = SocialAccount.objects.filter(
            provider='google',
            uid=google_id
        ).first()
        
        if social_account:
            # Usuário já fez login com Google antes
            user = social_account.user
            # Atualiza informações do usuário se necessário
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
            user.save()
            
            # Atualiza extra_data com informações mais recentes
            social_account.extra_data = user_info
            social_account.save()
            
        else:
            # Verifica se existe usuário com esse email
            try:
                user = User.objects.get(email=email)
                # Email existe, mas não tem conta Google vinculada
                # Vamos vincular o Google a essa conta existente
            except User.DoesNotExist:
                # Cria novo usuário
                username = email.split('@')[0]
                # Garante que o username seja único
                counter = 1
                original_username = username
                while User.objects.filter(username=username).exists():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                )
            
            # Cria o SocialAccount
            social_account = SocialAccount.objects.create(
                user=user,
                provider='google',
                uid=google_id,
                extra_data=user_info
            )
        
        # Gerencia EmailAddress (marca como verificado)
        email_address, email_created = EmailAddress.objects.get_or_create(
            user=user,
            email__iexact=email,
            defaults={
                'email': email,
                'verified': True,
                'primary': True,
            }
        )
        
        # Se o email já existia mas não estava verificado, verifica agora
        if not email_created and not email_address.verified:
            email_address.verified = True
            email_address.save()
        
        # Guarda os tokens OAuth (descomente se precisar acessar APIs do Google depois)
        SocialToken.objects.update_or_create(
            account=social_account,
            defaults={
                'token': access_token,
                'token_secret': refresh_token,
                'expires_at': timezone.now() + timedelta(seconds=expires_in)
            }
        )
        
        # Gera tokens JWT
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
        
    except Exception as e:
        return Response(
            {'error': f'Erro interno: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )