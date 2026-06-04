# RedWriter 一键启动脚本
# 用法: .\start.ps1

Write-Host "`n✍️  RedWriter — 小红书AI文案生成工具`n" -ForegroundColor Magenta

# 检查环境变量
if (-not $env:DEEPSEEK_API_KEY) {
    Write-Host "⚠️  未设置 DEEPSEEK_API_KEY，将使用模拟模式" -ForegroundColor Yellow
    Write-Host "   获取 Key: https://platform.deepseek.com/" -ForegroundColor Gray
    Write-Host "   设置方式: `$env:DEEPSEEK_API_KEY='sk-...'`n" -ForegroundColor Gray
}

# 启动后端
Write-Host "[1/2] 启动后端服务..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD/backend
    python -m pip install -r requirements.txt -q 2>$null
    python main.py
}

Start-Sleep -Seconds 2

# 启动前端
Write-Host "[2/2] 启动前端服务..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD/frontend
    npm install 2>$null
    npm run dev
}

Start-Sleep -Seconds 3

Write-Host "`n✅ 启动完成！" -ForegroundColor Green
Write-Host "   后端: http://localhost:8000" -ForegroundColor White
Write-Host "   前端: http://localhost:5173" -ForegroundColor White
Write-Host "   API文档: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`n按 Ctrl+C 停止所有服务`n" -ForegroundColor Gray

try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "服务已停止" -ForegroundColor Yellow
}
