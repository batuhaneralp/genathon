#!/bin/bash
echo "======================================="
echo "    VERITY GENATRON - START APP"
echo "======================================="
echo ""
echo "Checking dependencies..."
npm install

echo ""
echo "Building for maximum performance..."
npm run build

echo ""
echo "Starting Production Server..."
# Try to open browser
if which xdg-open > /dev/null
then
  xdg-open http://localhost:5173
elif which open > /dev/null
then
  open http://localhost:5173
fi

npm run preview -- --host --port 5173
