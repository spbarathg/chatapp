# Kill any existing Node.js processes
taskkill /F /IM node.exe 2>$null
taskkill /F /IM electron.exe 2>$null

# Remove the dist directory
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# Start the application
npm run dev 