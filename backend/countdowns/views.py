from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Event
from .serializers import EventSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Registers a new user and returns JWT access and refresh tokens.
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'detail': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 4:
        return Response(
            {'detail': 'Password must be at least 4 characters.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {'detail': 'Username already exists. Please choose a different username.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(username=username, password=password)
    refresh = RefreshToken.for_user(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username,
        'message': 'Account created successfully!'
    }, status=status.HTTP_201_CREATED)

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter events by the current authenticated user
        return Event.objects.filter(owner=self.request.user).order_by('target_date')

    def perform_create(self, serializer):
        # Automatically set the owner field to the logged-in user
        serializer.save(owner=self.request.user)