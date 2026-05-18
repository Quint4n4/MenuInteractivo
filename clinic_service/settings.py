"""
Django settings for clinic_service project.
"""

from pathlib import Path
import os
import logging
from dotenv import load_dotenv
import dj_database_url

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# SECURITY WARNING: keep the secret key used in production secret!
_INSECURE_FALLBACK_SECRET = 'django-insecure-fallback-key-change-this'
SECRET_KEY = os.getenv('SECRET_KEY', _INSECURE_FALLBACK_SECRET)

# En producción la SECRET_KEY DEBE venir de una variable de entorno estable.
# Si falta, fallamos de inmediato en lugar de firmar tokens JWT con una clave
# pública conocida (cualquiera podría falsificar sesiones de administrador).
if not DEBUG and SECRET_KEY == _INSECURE_FALLBACK_SECRET:
    raise RuntimeError(
        "SECRET_KEY no esta definida en produccion. Configura la variable de "
        "entorno SECRET_KEY en Railway con una cadena aleatoria larga y estable."
    )

# ALLOWED_HOSTS - strip whitespace and handle empty values
allowed_hosts_str = os.getenv('ALLOWED_HOSTS', '').strip()
if allowed_hosts_str:
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_str.split(',') if host.strip()]
else:
    ALLOWED_HOSTS = ['*'] if DEBUG else ['localhost']

# Railway hace el healthcheck con Host: healthcheck.railway.app y enruta el
# trafico interno por *.railway.app. Sin esto Django responde 400 al
# healthcheck y Railway marca el deploy como fallido.
if not DEBUG:
    for _railway_host in ('healthcheck.railway.app', '.railway.app'):
        if _railway_host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(_railway_host)

# CSRF Trusted Origins
if not DEBUG:
    CSRF_TRUSTED_ORIGINS = [
        origin.strip()
        for origin in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',')
        if origin.strip()
    ]
else:
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]

# Application definition

INSTALLED_APPS = [
    'daphne',  # Must be first for Channels
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps - Cloudinary must be before local apps
    'cloudinary_storage',
    'cloudinary',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'channels',

    # Local apps
    'accounts',
    'clinic',
    'catalog',
    'inventory',
    'orders',
    'feedbacks',
    'report_analytics',
    'common',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Whitenoise for static files
    'corsheaders.middleware.CorsMiddleware',  # Must be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'clinic_service.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'clinic_service.wsgi.application'
ASGI_APPLICATION = 'clinic_service.asgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    # Use DATABASE_URL if provided (recommended).
    # conn_max_age + conn_health_checks reciclan conexiones muertas a Postgres
    # (evita que una conexion rota deje el login caido hasta un reinicio manual).
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
    DATABASES['default'].setdefault('OPTIONS', {})['connect_timeout'] = 10
elif os.getenv('DATABASE_NAME'):
    # Alternative: Use individual database credentials
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DATABASE_NAME', 'clinic_service_db'),
            'USER': os.getenv('DATABASE_USER', 'postgres'),
            'PASSWORD': os.getenv('DATABASE_PASSWORD', ''),
            'HOST': os.getenv('DATABASE_HOST', 'localhost'),
            'PORT': os.getenv('DATABASE_PORT', '5432'),
        }
    }
else:
    # Fallback to SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudinary Configuration for Media Files
import cloudinary
import cloudinary.uploader
import cloudinary.api

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

# Configure cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

# Django 5.x STORAGES setting (replaces deprecated DEFAULT_FILE_STORAGE)
if not DEBUG:
    # Use Cloudinary for media files in production
    STORAGES = {
        "default": {
            "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
else:
    # In development, use local storage
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Custom User Model
# https://docs.djangoproject.com/en/5.2/topics/auth/customizing/#substituting-a-custom-user-model

AUTH_USER_MODEL = 'accounts.User'

# Authentication Backends
AUTHENTICATION_BACKENDS = [
    'accounts.backends.EmailBackend',  # Custom email authentication backend
    'django.contrib.auth.backends.ModelBackend',  # Fallback to default
]


# Django REST Framework
# https://www.django-rest-framework.org/api-guide/settings/

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S.%fZ',
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
}


# Simple JWT Settings
# https://django-rest-framework-simplejwt.readthedocs.io/en/latest/settings.html

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    # Clave de firma JWT independiente de SECRET_KEY: asi rotar SECRET_KEY no
    # invalida todas las sesiones. Cae a SECRET_KEY si JWT_SIGNING_KEY no existe.
    'SIGNING_KEY': os.getenv('JWT_SIGNING_KEY', SECRET_KEY),
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',
}


# CORS Configuration
# https://github.com/adamchainz/django-cors-headers

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


# Django Channels Configuration
# https://channels.readthedocs.io/en/stable/

# Channel Layers - Redis in production, InMemory in development
if DEBUG:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [os.getenv('REDIS_URL', 'redis://localhost:6379/0')],
                'capacity': 1500,
                'expiry': 10,
            },
        },
    }

# WebSocket Configuration
WS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('WS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
]

# Security Settings for Production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# Filtro: silencia el flood de "Not Found: /api/public/kiosk/.../active-patient/"
# (el 404 es la senal normal de "no hay paciente asignado", no un error real).
class _SuppressActivePatient404(logging.Filter):
    def filter(self, record):
        return 'active-patient' not in record.getMessage()


# Structured Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'suppress_active_patient_404': {
            '()': 'clinic_service.settings._SuppressActivePatient404',
        },
    },
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'filters': ['suppress_active_patient_404'],
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'orders': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'feedbacks': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'inventory': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'clinic': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    },
}
