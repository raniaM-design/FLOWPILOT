# Script PowerShell pour nettoyer .env.local
# Supprime les doublons et nettoie le format

Write-Host "🧹 Nettoyage du fichier .env.local..." -ForegroundColor Cyan

if (-not (Test-Path .env.local)) {
    Write-Host "❌ Le fichier .env.local n'existe pas" -ForegroundColor Red
    exit 1
}

# Lire le fichier
$lines = Get-Content .env.local
$cleaned = @{}
$output = @()

foreach ($line in $lines) {
    $line = $line.Trim()
    
    # Ignorer les lignes vides et les commentaires
    if ($line -eq "" -or $line.StartsWith("#")) {
        $output += $line
        continue
    }
    
    # Extraire la clé et la valeur
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Enlever les guillemets si présents
        $value = $value -replace '^["''](.+)["'']$', '$1'
        
        # Garder seulement la dernière valeur pour chaque clé
        if (-not $cleaned.ContainsKey($key)) {
            $cleaned[$key] = $value
        } else {
            Write-Host "⚠️  Doublon détecté pour $key, garde la dernière valeur" -ForegroundColor Yellow
            $cleaned[$key] = $value
        }
    } else {
        # Ligne non reconnue, la garder telle quelle
        $output += $line
    }
}

# Reconstruire le fichier
$newContent = @()

# Ajouter les lignes de commentaire et vides au début
foreach ($line in $lines) {
    if ($line.Trim() -eq "" -or $line.Trim().StartsWith("#")) {
        $newContent += $line
    } else {
        break
    }
}

# Ajouter les variables nettoyées
foreach ($key in $cleaned.Keys | Sort-Object) {
    $newContent += "$key=$($cleaned[$key])"
}

# Sauvegarder
$backupFile = ".env.local.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item .env.local $backupFile
Write-Host "✅ Backup créé: $backupFile" -ForegroundColor Green

$newContent | Set-Content .env.local -Encoding UTF8

Write-Host "✅ Fichier .env.local nettoyé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Variables trouvées:" -ForegroundColor Cyan
foreach ($key in $cleaned.Keys | Sort-Object) {
    $value = $cleaned[$key]
    if ($key -match "KEY|SECRET|PASSWORD") {
        $displayValue = if ($value.Length -gt 20) { $value.Substring(0, 20) + "..." } else { "***" }
    } else {
        $displayValue = $value
    }
    Write-Host "  $key = $displayValue" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 Redémarrez votre serveur pour appliquer les changements:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White

