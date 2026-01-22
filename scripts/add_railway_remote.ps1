# Script para agregar un nuevo remote y subir el proyecto a Railway
# Uso: .\scripts\add_railway_remote.ps1 -NewRepoUrl "https://github.com/usuario/nuevo-repo.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewRepoUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$RemoteName = "railway"
)

Write-Host "Agregando nuevo remote '$RemoteName'..." -ForegroundColor Cyan
git remote add $RemoteName $NewRepoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Remote agregado exitosamente" -ForegroundColor Green
    
    Write-Host "`nListando remotes configurados:" -ForegroundColor Cyan
    git remote -v
    
    Write-Host "`n¿Deseas hacer push al nuevo repositorio ahora? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "`nHaciendo push a $RemoteName..." -ForegroundColor Cyan
        git push $RemoteName main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Push completado exitosamente" -ForegroundColor Green
            Write-Host "`nTu proyecto ahora está en ambos repositorios:" -ForegroundColor Cyan
            Write-Host "  - origin: repositorio original" -ForegroundColor White
            Write-Host "  - $RemoteName : nuevo repositorio para Railway" -ForegroundColor White
        } else {
            Write-Host "✗ Error al hacer push. Verifica que el repositorio existe y tienes permisos." -ForegroundColor Red
        }
    } else {
        Write-Host "`nPara hacer push más tarde, ejecuta:" -ForegroundColor Yellow
        Write-Host "  git push $RemoteName main" -ForegroundColor White
    }
} else {
    Write-Host "✗ Error al agregar remote. Puede que ya exista un remote con ese nombre." -ForegroundColor Red
    Write-Host "Para ver los remotes existentes: git remote -v" -ForegroundColor Yellow
}
