# ⚙️ Configuración Específica para Railway

Guía rápida para configurar correctamente Backend y Frontend en Railway.

## 🚨 IMPORTANTE: Backend está CRASHED

El servicio "web" (backend) está crasheado. **NO lo dejes por defecto**. Necesita configuración específica.

---

## 🐍 Configuración del Backend (Servicio "web")

### Settings → Deploy

**Root Directory**: (dejar vacío - usa la raíz del proyecto)

**Build Command**: 
- Railway detecta automáticamente `requirements.txt` y ejecuta `pip install -r requirements.txt`
- **NO necesitas configurar nada aquí** - déjalo por defecto ✅

**Start Command**: 
- Railway usa automáticamente el `Procfile`
- El Procfile ya tiene: `web: python manage.py migrate && python init_users.py && python manage.py collectstatic --noinput && daphne -b 0.0.0.0 -p $PORT clinic_service.asgi:application`
- **NO necesitas configurar nada aquí** - déjalo por defecto ✅

**Watch Paths**: (opcional)
- Si quieres que solo se despliegue cuando cambies el backend, agrega: `/clinic_service/**`, `/accounts/**`, `/clinic/**`, etc.
- O déjalo vacío para que se despliegue con cualquier cambio

### Settings → Variables (⚠️ CRÍTICO - Sin esto el backend CRASHEA)

**DEBES configurar estas variables de entorno:**

```
SECRET_KEY=<genera-una-nueva-clave-secreta>
DEBUG=False
ALLOWED_HOSTS=web-production-678c8.up.railway.app
CSRF_TRUSTED_ORIGINS=https://bountiful-cat-production.up.railway.app
CLOUDINARY_CLOUD_NAME=<tu-cloud-name>
CLOUDINARY_API_KEY=<tu-api-key>
CLOUDINARY_API_SECRET=<tu-api-secret>
CORS_ALLOWED_ORIGINS=https://bountiful-cat-production.up.railway.app
WS_ALLOWED_ORIGINS=https://bountiful-cat-production.up.railway.app
```

**⚠️ IMPORTANTE:**
- Reemplaza las URLs con las URLs reales de tus servicios
- `DATABASE_URL` se configura automáticamente cuando conectas PostgreSQL al backend
- **Sin estas variables, el backend seguirá crasheando**

### Conectar PostgreSQL al Backend

1. Ve al servicio **Postgres**
2. Haz clic en **"Connect"** o en la pestaña **"Variables"**
3. Selecciona el servicio **"web"** (backend)
4. Railway configurará automáticamente `DATABASE_URL`

---

## ⚛️ Configuración del Frontend (Servicio "bountiful-cat")

### Settings → Deploy

**Root Directory**: `frontend` ✅
- **IMPORTANTE**: Debe ser `frontend` (no `/frontend` ni `./frontend`)

**Build Command**: 
```
npm install && npm run build
```
- **DEBES configurarlo** - no lo dejes vacío

**Start Command**: 
```
npx serve -s dist -l $PORT
```
- **DEBES configurarlo** - Railway no sirve archivos estáticos automáticamente
- Esto usa `serve` para servir los archivos compilados de React

**Watch Paths**: `/frontend/**` ✅
- **Está bien así** - solo se desplegará cuando cambies archivos en `/frontend/`

### Settings → Variables

**DEBES configurar estas variables de entorno:**

```
VITE_API_BASE_URL=https://web-production-678c8.up.railway.app
VITE_WS_BASE_URL=wss://web-production-678c8.up.railway.app
```

**⚠️ IMPORTANTE:**
- Reemplaza `web-production-678c8.up.railway.app` con la URL real de tu backend
- Usa `https://` para HTTP y `wss://` para WebSocket
- NO incluyas `/api` al final

---

## 📋 Checklist de Configuración

### Backend (Servicio "web")

- [ ] **Root Directory**: Vacío (raíz del proyecto)
- [ ] **Build Command**: Por defecto (Railway lo detecta)
- [ ] **Start Command**: Por defecto (usa Procfile)
- [ ] **Variables de entorno configuradas**:
  - [ ] `SECRET_KEY`
  - [ ] `DEBUG=False`
  - [ ] `ALLOWED_HOSTS` (URL del backend)
  - [ ] `CSRF_TRUSTED_ORIGINS` (URL del frontend)
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`
  - [ ] `CORS_ALLOWED_ORIGINS` (URL del frontend)
  - [ ] `WS_ALLOWED_ORIGINS` (URL del frontend)
  - [ ] `DATABASE_URL` (se configura automáticamente al conectar PostgreSQL)
- [ ] **PostgreSQL conectado al backend**

### Frontend (Servicio "bountiful-cat")

- [ ] **Root Directory**: `frontend`
- [ ] **Build Command**: `npm install && npm run build`
- [ ] **Start Command**: `npx serve -s dist -l $PORT`
- [ ] **Watch Paths**: `/frontend/**` (ya está configurado)
- [ ] **Variables de entorno configuradas**:
  - [ ] `VITE_API_BASE_URL` (URL del backend con https://)
  - [ ] `VITE_WS_BASE_URL` (URL del backend con wss://)

---

## 🔍 Cómo Obtener las URLs de tus Servicios

1. En cada servicio, ve a **"Settings"**
2. Busca la sección **"Domains"** o **"Networking"**
3. Railway te dará una URL como:
   - Backend: `https://web-production-678c8.up.railway.app`
   - Frontend: `https://bountiful-cat-production.up.railway.app`
4. Copia estas URLs y úsalas en las variables de entorno

---

## 🚀 Después de Configurar

1. **Guarda todos los cambios** en Railway
2. Railway comenzará un nuevo deployment automáticamente
3. **Revisa los logs** en la pestaña "Deployments" para ver si hay errores
4. El backend debería dejar de crashear una vez que todas las variables estén configuradas

---

## ❌ Errores Comunes

### Backend sigue crasheando

**Causa**: Faltan variables de entorno o están mal configuradas

**Solución**:
1. Ve a los logs del backend (pestaña "Deployments" → selecciona el deployment → "View Logs")
2. Busca errores como "SECRET_KEY not set" o "DATABASE_URL not found"
3. Verifica que todas las variables estén configuradas correctamente
4. Asegúrate de que PostgreSQL esté conectado al backend

### Frontend no se construye

**Causa**: Build Command o Root Directory incorrectos

**Solución**:
1. Verifica que **Root Directory** sea exactamente `frontend` (sin barras)
2. Verifica que **Build Command** sea `npm install && npm run build`
3. Revisa los logs para ver el error específico

### Frontend no se conecta al backend

**Causa**: Variables de entorno incorrectas o backend no está funcionando

**Solución**:
1. Verifica que `VITE_API_BASE_URL` tenga la URL correcta del backend
2. Verifica que el backend esté funcionando (no crasheado)
3. Verifica que `CORS_ALLOWED_ORIGINS` en el backend tenga la URL del frontend

---

## 📝 Resumen Rápido

**Backend:**
- Root Directory: Vacío ✅
- Build/Start: Por defecto (usa Procfile) ✅
- **Variables de entorno: CRÍTICO** ⚠️

**Frontend:**
- Root Directory: `frontend` ✅
- Build Command: `npm install && npm run build` ⚠️
- Start Command: `npx serve -s dist -l $PORT` ⚠️
- Watch Paths: `/frontend/**` ✅
- Variables de entorno: CRÍTICO ⚠️
