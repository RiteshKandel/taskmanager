from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer
from .models import NotificationPreference

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    # CreateAPIView handles POST automatically — we just point it at our serializer
    queryset            = User.objects.all()
    serializer_class    = RegisterSerializer
    permission_classes  = [AllowAny]  # no login needed to register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # After registering, immediately return JWT tokens so the user is logged in
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':    UserSerializer(user, context={'request': request}).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    # TokenObtainPairView already handles email+password login
    # We just override to also return user info alongside the tokens
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data['email'])
            response.data['user'] = UserSerializer(user, context={'request': request}).data
        return response


class MeView(APIView):
    # GET /api/auth/me/ — returns the currently logged-in user's info
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        # Allow the user to update their own name/avatar
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LogoutView(APIView):
    # Blacklist the refresh token so it can't be used again
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()  # invalidates this token permanently
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user             = request.user
        current_password = request.data.get('current_password')
        new_password     = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Both fields required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not user.check_password(current_password):
            return Response(
                {'current_password': ['Incorrect password.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 8:
            return Response(
                {'new_password': ['Minimum 8 characters.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(new_password)
        user.save()
        return Response({'success': True})


class NotificationPrefsView(APIView):
    """GET/PATCH /api/auth/notification-prefs/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
            return Response({
                'task_assigned':  prefs.task_assigned,
                'task_updated':   prefs.task_updated,
                'project_invite': prefs.project_invite,
                'reminders':      prefs.reminders,
            })
        except Exception:
            # Graceful fallback if migration hasn't run yet
            return Response({
                'task_assigned':  True,
                'task_updated':   True,
                'project_invite': True,
                'reminders':      True,
            })

    def patch(self, request):
        try:
            prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
            for field in ['task_assigned', 'task_updated', 'project_invite', 'reminders']:
                if field in request.data:
                    setattr(prefs, field, bool(request.data[field]))
            prefs.save()
            return Response({'success': True})
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class DeleteAccountView(APIView):
    """DELETE /api/auth/delete-account/ — requires password confirmation"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Password required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(password):
            return Response({'error': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)