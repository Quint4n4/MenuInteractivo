# 🔧 Solucionar: Tablas No Se Crean en la Base de Datos

Si las migraciones se ejecutan pero las tablas no aparecen, sigue estos pasos:

## 🔍 Diagnóstico

### Paso 1: Verificar que DATABASE_URL esté configurada

1. Ve al servicio **"web"** (backend) en Railway
2. Haz clic en la pestaña **"Variables"**
3. Busca la variable `DATABASE_URL`
4. **Debe estar presente y tener un valor** (aunque esté enmascarado con `******`)

**Si NO está presente:**
- Ve al servicio **"Postgres"**
- Haz clic en **"Connect"** o en la pestaña **"Variables"**
- Selecciona el servicio **"web"** para conectarlo
- Railway configurará automáticamente `DATABASE_URL`

### Paso 2: Revisar los Logs Completos del Deployment

1. Ve al servicio **"web"** → pestaña **"Deployments"**
2. Haz clic en el deployment más reciente
3. Revisa los logs, especialmente:
   - **Build Logs**: Busca errores durante la instalación
   - **Deploy Logs**: Busca la salida de `python manage.py migrate`

**Busca estos mensajes:**
- ✅ `Operations to perform:` - Indica que las migraciones se están ejecutando
- ✅ `Applying <app>.<migration>... OK` - Indica que las migraciones se aplicaron
- ❌ `django.db.utils.OperationalError` - Error de conexión a la BD
- ❌ `django.core.exceptions.ImproperlyConfigured` - Error de configuración

### Paso 3: Verificar que las Migraciones Existan

Las migraciones deben estar en el repositorio. Verifica que estos archivos existan:

```
accounts/migrations/0001_initial.py
accounts/migrations/0002_role_userrole.py
clinic/migrations/0001_initial.py
catalog/migrations/0001_initial.py
inventory/migrations/0001_initial.py
orders/migrations/0001_initial.py
```

## 🛠️ Soluciones

### Solución 1: Ejecutar Migraciones Manualmente (Railway CLI)

Si tienes Railway CLI instalado:

```bash
# Instalar Railway CLI (si no lo tienes)
npm i -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Ejecutar migraciones manualmente
railway run python manage.py migrate
```

### Solución 2: Forzar Nuevo Deployment

1. Ve al servicio **"web"** → pestaña **"Deployments"**
2. Haz clic en **"Redeploy"** o **"Deploy"**
3. Esto ejecutará nuevamente el Procfile que incluye `python manage.py migrate`

### Solución 3: Agregar Comando de Verificación

Puedes agregar un comando de verificación al Procfile temporalmente:

1. Edita el `Procfile` localmente:
```
web: python manage.py migrate --run-syncdb && python init_users.py && python manage.py collectstatic --noinput && daphne -b 0.0.0.0 -p $PORT clinic_service.asgi:application
```

2. Haz commit y push:
```bash
git add Procfile
git commit -m "Agregar --run-syncdb a migrate"
git push railway main
```

### Solución 4: Verificar Conexión a la Base de Datos

Crea un script temporal para verificar la conexión:

1. Crea un archivo `test_db.py` en la raíz:
```python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_service.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Conexión exitosa a PostgreSQL: {version[0]}")
        
        # Listar tablas existentes
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()
        print(f"\n📊 Tablas existentes: {len(tables)}")
        for table in tables:
            print(f"  - {table[0]}")
            
except Exception as e:
    print(f"❌ Error de conexión: {e}")
```

2. Ejecuta en Railway:
```bash
railway run python test_db.py
```

### Solución 5: Verificar Variables de Entorno en el Deployment

Asegúrate de que estas variables estén configuradas en el servicio **"web"**:

```
DATABASE_URL=<debe estar presente y configurada automáticamente>
DJANGO_SETTINGS_MODULE=clinic_service.settings
```

## 🔍 Verificación Post-Solución

### Verificar Tablas en Railway

1. Ve al servicio **"Postgres"** → pestaña **"Database"**
2. Haz clic en **"Data"**
3. Deberías ver las tablas creadas:
   - `accounts_user`
   - `accounts_role`
   - `clinic_room`
   - `clinic_patient`
   - `catalog_productcategory`
   - `catalog_product`
   - `inventory_inventorybalance`
   - `orders_order`
   - Y más...

### Verificar desde los Logs

En los logs del deployment, deberías ver algo como:

```
Operations to perform:
  Apply all migrations: accounts, admin, auth, clinic, catalog, ...
Running migrations:
  Applying accounts.0001_initial... OK
  Applying accounts.0002_role_userrole... OK
  Applying clinic.0001_initial... OK
  Applying catalog.0001_initial... OK
  ...
```

## ❌ Errores Comunes

### Error: "relation does not exist"

**Causa**: Las migraciones no se ejecutaron o fallaron

**Solución**: 
1. Verifica que `DATABASE_URL` esté configurada
2. Revisa los logs del deployment
3. Ejecuta las migraciones manualmente

### Error: "could not connect to server"

**Causa**: PostgreSQL no está conectado al servicio backend

**Solución**:
1. Ve al servicio **"Postgres"**
2. Haz clic en **"Connect"**
3. Selecciona el servicio **"web"**

### Error: "no such table: django_migrations"

**Causa**: La base de datos está vacía o las migraciones no se ejecutaron

**Solución**: Ejecuta `python manage.py migrate` manualmente

## 📝 Checklist de Verificación

- [ ] `DATABASE_URL` está configurada en el servicio "web"
- [ ] PostgreSQL está conectado al servicio "web"
- [ ] Los logs muestran que `python manage.py migrate` se ejecutó
- [ ] Los logs no muestran errores de conexión
- [ ] Las migraciones existen en el repositorio
- [ ] El Procfile incluye `python manage.py migrate`

## 🚀 Si Nada Funciona

1. **Verifica los logs completos** del último deployment
2. **Ejecuta las migraciones manualmente** usando Railway CLI
3. **Verifica la conexión** con el script de prueba
4. **Contacta soporte de Railway** si el problema persiste

---

**Nota**: Si las migraciones se ejecutan correctamente en los logs pero las tablas no aparecen, puede ser un problema de visualización en Railway. Intenta refrescar la página o verificar directamente con una consulta SQL.
