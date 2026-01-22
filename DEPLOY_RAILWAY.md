# Guía para Subir el Proyecto a Otro Repositorio (Railway)

Esta guía te ayudará a crear una copia del proyecto en otro repositorio para desplegarlo en Railway.

## Opción 1: Agregar un Nuevo Remote (Recomendado)

Esta opción te permite mantener ambos repositorios sincronizados.

### Pasos:

1. **Crea el nuevo repositorio en GitHub/GitLab/etc.**
   - Crea un repositorio vacío en tu plataforma preferida
   - Copia la URL del repositorio (ej: `https://github.com/usuario/nuevo-repo.git`)

2. **Agrega el nuevo remote usando el script:**
   
   **En Windows (PowerShell):**
   ```powershell
   .\scripts\add_railway_remote.ps1 -NewRepoUrl "https://github.com/usuario/nuevo-repo.git"
   ```
   
   **En Linux/Mac:**
   ```bash
   chmod +x scripts/add_railway_remote.sh
   ./scripts/add_railway_remote.sh https://github.com/usuario/nuevo-repo.git
   ```

3. **O manualmente:**
   ```bash
   # Agregar el nuevo remote
   git remote add railway https://github.com/usuario/nuevo-repo.git
   
   # Verificar que se agregó correctamente
   git remote -v
   
   # Hacer push al nuevo repositorio
   git push railway main
   ```

### Ventajas:
- ✅ Mantienes ambos repositorios sincronizados
- ✅ Puedes hacer push a ambos con comandos separados
- ✅ El repositorio original sigue funcionando normalmente

### Comandos útiles:

```bash
# Ver todos los remotes
git remote -v

# Hacer push solo al repositorio original
git push origin main

# Hacer push solo al repositorio de Railway
git push railway main

# Hacer push a ambos repositorios
git push origin main
git push railway main

# Eliminar un remote (si es necesario)
git remote remove railway
```

---

## Opción 2: Cambiar el Remote (Solo un Repositorio)

Si solo quieres usar el nuevo repositorio y no necesitas mantener el original:

```bash
# Cambiar la URL del remote origin
git remote set-url origin https://github.com/usuario/nuevo-repo.git

# Verificar
git remote -v

# Hacer push
git push origin main
```

---

## Opción 3: Clonar y Cambiar Remote

Si prefieres trabajar con una copia completamente separada:

```bash
# Clonar el repositorio actual
git clone https://github.com/EmanuelRealGamboa/clinica-camsa-.git proyecto-railway
cd proyecto-railway

# Cambiar el remote
git remote set-url origin https://github.com/usuario/nuevo-repo.git

# Hacer push
git push origin main
```

---

## Configuración para Railway

Una vez que tengas el código en el nuevo repositorio:

1. **Conecta Railway al nuevo repositorio:**
   - En Railway, crea un nuevo proyecto
   - Selecciona "Deploy from GitHub repo"
   - Elige tu nuevo repositorio

2. **Variables de entorno:**
   - Railway leerá automáticamente los archivos `.env.example`
   - Configura las variables de entorno en el dashboard de Railway

3. **Build y Deploy:**
   - Railway detectará automáticamente que es un proyecto Django + React
   - Asegúrate de tener un `Procfile` (ya existe en el proyecto)

---

## Notas Importantes

- ⚠️ **No olvides configurar las variables de entorno** en Railway
- ⚠️ **Revisa el archivo `.env.example`** para ver qué variables necesitas
- ⚠️ **El archivo `.env.production`** puede servir como referencia
- ⚠️ **Asegúrate de que el Procfile esté correcto** para Railway

---

## Troubleshooting

### Error: "remote already exists"
Si el remote ya existe, puedes:
- Eliminarlo: `git remote remove railway`
- O usar otro nombre: `git remote add railway2 <url>`

### Error: "Permission denied"
- Verifica que tienes acceso al nuevo repositorio
- Puede que necesites autenticarte con GitHub/GitLab

### Error: "Repository not found"
- Verifica que el repositorio existe
- Verifica que tienes permisos de escritura
