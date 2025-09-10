@echo off
echo Создание портативной версии для Windows...
call npm run pack:windows
echo.
echo Сборка завершена! 
echo Исполняемый файл: release\win-unpacked\Chomsky Grammar.exe
echo.
pause
