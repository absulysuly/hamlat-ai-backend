@echo off
cls
echo ===================================================
echo   Packaging HamlatAI Repository into a ZIP file
echo ===================================================
echo.
echo This script will create a file named 'HamlatAI-Updated-Repo.zip' on your Desktop.

set "SOURCE_DIR=E:\Election-campaign"
set "DEST_ZIP=%USERPROFILE%\Desktop\HamlatAI-Updated-Repo.zip"

echo Zipping project from: %SOURCE_DIR%
echo Saving to: %DEST_ZIP%
echo.
echo Please wait, this may take a moment...

:: Use PowerShell to create the zip file, excluding node_modules
powershell -NoProfile -Command "& {Compress-Archive -Path (Get-ChildItem -Path '%SOURCE_DIR%' -Exclude 'node_modules', '.git', '*.zip') -DestinationPath '%DEST_ZIP%' -Force}"

echo.
echo ===================================================
echo   SUCCESS!
===================================================
echo.
echo The updated repository has been saved to your Desktop as:
echo HamlatAI-Updated-Repo.zip
echo.
pause
