from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount
import requests
import logging
from decouple import config
from .serializers import UserSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Retorna os dados do usuário autenticado
    
    GET /api/profile/
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Atualiza os dados do usuário autenticado
    
    PUT/PATCH /api/profile/update/
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
    
    GET /api/dashboard/
    """
    user_data = UserSerializer(request.user).data
    
    data = {
        'user': user_data,
        'message': f'Bem-vindo ao dashboard, {request.user.username}!',
    }
    
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Autenticação via Google OAuth
    
    POST /api/auth/google/callback/
    
    Request Body:
    {
        "code": "4/0AY0e-g7...",
        "redirect_uri": "http://localhost:3000/auth/callback"
    }
    
    Response (200 OK):
    {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "user": {...}
    }
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
        
        token_response = requests.post(token_url, data=token_data, timeout=10)
        
        if token_response.status_code != 200:
            logger.warning(f'Falha ao obter token do Google: {token_response.text}')
            return Response(
                {'error': 'Código de autorização inválido ou expirado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token_json = token_response.json()
        access_token = token_json.get('access_token')
        
        if not access_token:
            return Response(
                {'error': 'Token de acesso não recebido do Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtém informações do usuário do Google
        user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        user_response = requests.get(
            user_info_url, 
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        
        if user_response.status_code != 200:
            logger.warning(f'Falha ao obter informações do usuário: {user_response.text}')
            return Response(
                {'error': 'Falha ao obter informações do usuário'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_info = user_response.json()
        email = user_info.get('email')
        google_id = user_info.get('id')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        
        if not email or not google_id:
            return Response(
                {'error': 'Informações incompletas recebidas do Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        User = get_user_model()
        
        # Verifica se já existe conta Google pelo UID
        social_account = SocialAccount.objects.filter(
            provider='google',
            uid=google_id
        ).first()
        
        if social_account:
            # Usuário já existe
            user = social_account.user
            # Atualiza informações
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
            user.save()
            
            # Atualiza extra_data
            social_account.extra_data = user_info
            social_account.save()
            
        else:
            # Verifica se existe usuário com esse email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Cria novo usuário
                username = email.split('@')[0]
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
        
        # Gerencia EmailAddress
        email_address, email_created = EmailAddress.objects.get_or_create(
            user=user,
            email__iexact=email,
            defaults={
                'email': email,
                'verified': True,
                'primary': True,
            }
        )
        
        if not email_created and not email_address.verified:
            email_address.verified = True
            email_address.save()
        
        # Gera tokens JWT
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    
    except requests.RequestException as e:
        logger.error(f'Erro de comunicação com Google: {str(e)}', exc_info=True)
        return Response(
            {'error': 'Falha ao comunicar com o Google. Tente novamente.'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    except Exception as e:
        logger.error(f'Erro no Google Auth: {str(e)}', exc_info=True)
        
        if not settings.DEBUG:
            return Response(
                {'error': 'Ocorreu um erro. Tente novamente mais tarde.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        else:
            return Response(
                {'error': f'Erro: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )