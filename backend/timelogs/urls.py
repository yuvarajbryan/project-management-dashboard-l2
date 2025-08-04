from rest_framework.routers import DefaultRouter
from .views import TimeLogViewSet

router = DefaultRouter()
router.register(r'', TimeLogViewSet, basename='timelog')

urlpatterns = router.urls 