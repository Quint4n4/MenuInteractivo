# Script para limpiar credenciales de GitHub guardadas en Windows
# Uso: .\scripts\limpiar_credenciales_github.ps1

Write-Host "Limpiando credenciales de GitHub guardadas..." -ForegroundColor Yellow
Write-Host ""

# Listar credenciales de GitHub
$credentials = cmdkey /list | Select-String "github"

if ($credentials) {
    Write-Host "Credenciales de GitHub encontradas:" -ForegroundColor Cyan
    $credentials | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
    
    Write-Host "Para eliminar credenciales específicas, ejecuta:" -ForegroundColor Yellow
    Write-Host "  cmdkey /delete:git:https://github.com" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "¿Deseas eliminar las credenciales de GitHub ahora? (S/N)"
    
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host ""
        Write-Host "Eliminando credenciales..." -ForegroundColor Yellow
        cmdkey /delete:git:https://github.com 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Credenciales eliminadas" -ForegroundColor Green
        } else {
            Write-Host "⚠ No se encontraron credenciales para eliminar o ya fueron eliminadas" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Ahora cuando hagas push, Git te pedirá las credenciales nuevamente." -ForegroundColor Cyan
        Write-Host "Asegúrate de usar las credenciales de la cuenta de la empresa (Quint4n4)." -ForegroundColor Cyan
    }
} else {
    Write-Host "No se encontraron credenciales de GitHub guardadas." -ForegroundColor Green
    Write-Host ""
    Write-Host "Si aún tienes problemas, puedes:" -ForegroundColor Yellow
    Write-Host "1. Usar un Token de Acceso Personal (PAT)" -ForegroundColor White
    Write-Host "2. Configurar SSH keys" -ForegroundColor White
    Write-Host "3. Ver la guía: RESOLVER_PUSH_PERMISOS.md" -ForegroundColor White
}

Write-Host ""
