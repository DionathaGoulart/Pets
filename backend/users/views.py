from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
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