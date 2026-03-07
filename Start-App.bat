@echo off
echo =======================================
echo     VERITY GENATRON - START APP
echo =======================================
echo.
echo Checking dependencies...
call npm install

echo.
echo Building for maximum performance...
call npm run build

echo.
echo Starting Production Server...
echo The app will open in your browser shortly.
start http://localhost:5173
call npm run preview -- --host --port 5173
