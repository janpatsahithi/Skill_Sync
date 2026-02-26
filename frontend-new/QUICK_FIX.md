# Quick Fix Guide - Nothing Displaying

## Immediate Steps

### 1. Check if Backend is Running

Open terminal and run:
```bash
curl http://localhost:8000
```

If you get an error, start the backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. Check if Frontend is Running

In another terminal:
```bash
cd frontend-new
npm run dev
```

You should see:
```
Local: http://localhost:5173/
```

### 3. Open Browser Console

1. Open http://localhost:5173
2. Press F12 to open DevTools
3. Check Console tab for errors
4. Check Network tab for failed requests

### 4. Clear Everything and Restart

```bash
# Stop all running servers (Ctrl+C)

# Frontend
cd frontend-new
rm -rf node_modules
npm install
npm run dev

# Backend (in another terminal)
cd backend
uvicorn app.main:app --reload --port 8000
```

### 5. Test Direct Navigation

Try these URLs directly:
- http://localhost:5173/login
- http://localhost:5173/register
- http://localhost:5173/dashboard (will redirect to login if not authenticated)

### 6. Check Browser Console

Open browser console (F12) and look for:
- Red errors (these are blocking)
- Yellow warnings (usually not blocking)
- Network errors (check Network tab)

### 7. Verify Files

Make sure these files exist:
- `frontend-new/src/App.jsx`
- `frontend-new/src/main.jsx`
- `frontend-new/src/index.css`
- `frontend-new/index.html`
- `frontend-new/package.json`

### 8. Most Common Issues

#### Blank Screen
- **Cause:** JavaScript error preventing render
- **Fix:** Check browser console for errors

#### "Cannot GET /"
- **Cause:** Normal for React Router
- **Fix:** Navigate to `/login` directly

#### Network Errors
- **Cause:** Backend not running or CORS issue
- **Fix:** Start backend, check CORS settings

#### Stuck on "Loading..."
- **Cause:** Auth check hanging
- **Fix:** Clear localStorage: `localStorage.clear()` in console

### 9. Emergency Test

If nothing works, create a minimal test:

1. Edit `frontend-new/src/App.jsx`:
```jsx
function App() {
  return <div>Hello World - App is working!</div>
}
```

2. If this displays, the issue is with routing/auth
3. If this doesn't display, the issue is with React/Vite setup

### 10. Still Not Working?

Provide this information:
1. Browser console errors (screenshot)
2. Terminal output from `npm run dev`
3. Terminal output from backend server
4. What you see (blank screen, error message, etc.)



