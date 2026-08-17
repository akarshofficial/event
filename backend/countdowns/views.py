from rest_framework import viewsets
from .models import Event
from .serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    def get_queryset(self):
        # Filter events by the current authenticated user
        return Event.objects.filter(owner=self.request.user).order_by('target_date')

    def perform_create(self, serializer):
        # Automatically set the owner field to the logged-in user
        serializer.save(owner=self.request.user)