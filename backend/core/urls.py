from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def health_check(request):
    return JsonResponse({
        'status': 'online',
        'message': 'Event Countdown API is running smoothly!',
        'endpoints': {
            'token': '/api/token/',
            'refresh_token': '/api/token/refresh/',
            'events': '/api/events/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    # Health check at root
    path('', health_check, name='health_check'),
    path('health/', health_check, name='health_check_alt'),
    path('api/', health_check, name='api_health_check'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # JWT Auth (supports both /api/token/ and /token/)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair_direct'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh_direct'),
    
    # Events CRUD (supports both /api/events/ and /events/)
    path('api/', include('countdowns.urls')),
    path('', include('countdowns.urls')),
]