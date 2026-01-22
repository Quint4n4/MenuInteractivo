#!/bin/bash
# Script para agregar un nuevo remote y subir el proyecto a Railway
# Uso: ./scripts/add_railway_remote.sh <URL_DEL_NUEVO_REPO> [nombre_remote]

NEW_REPO_URL=$1
REMOTE_NAME=${2:-"railway"}

if [ -z "$NEW_REPO_URL" ]; then
    echo "Error: Debes proporcionar la URL del nuevo repositorio"
    echo "Uso: ./scripts/add_railway_remote.sh <URL_DEL_NUEVO_REPO> [nombre_remote]"
    exit 1
fi

echo "Agregando nuevo remote '$REMOTE_NAME'..."
git remote add $REMOTE_NAME $NEW_REPO_URL

if [ $? -eq 0 ]; then
    echo "✓ Remote agregado exitosamente"
    
    echo ""
    echo "Listando remotes configurados:"
    git remote -v
    
    echo ""
    read -p "¿Deseas hacer push al nuevo repositorio ahora? (s/n): " response
    
    if [[ "$response" =~ ^[SsYy]$ ]]; then
        echo ""
        echo "Haciendo push a $REMOTE_NAME..."
        git push $REMOTE_NAME main
        
        if [ $? -eq 0 ]; then
            echo "✓ Push completado exitosamente"
            echo ""
            echo "Tu proyecto ahora está en ambos repositorios:"
            echo "  - origin: repositorio original"
            echo "  - $REMOTE_NAME: nuevo repositorio para Railway"
        else
            echo "✗ Error al hacer push. Verifica que el repositorio existe y tienes permisos."
        fi
    else
        echo ""
        echo "Para hacer push más tarde, ejecuta:"
        echo "  git push $REMOTE_NAME main"
    fi
else
    echo "✗ Error al agregar remote. Puede que ya exista un remote con ese nombre."
    echo "Para ver los remotes existentes: git remote -v"
fi
