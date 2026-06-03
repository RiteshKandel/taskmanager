from .settings import *   # inherit everything from base settings
import os
# pyrefly: ignore [missing-import]
import dj_database_url

# ── Security ──────────────────────────────────────────────────
DEBUG = False
SECRET_KEY = os.environ['SECRET_KEY']   # must be set in Railway env vars

# Railway gives you a domain like your-app.up.railway.app
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# ── Database — Railway provides DATABASE_URL automatically ────
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ['DATABASE_URL'],
        conn_max_age=600,
    )
}

# ── Static files — whitenoise serves them ─────────────────────
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ── CORS — allow your Vercel frontend ─────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ── Security headers ──────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
