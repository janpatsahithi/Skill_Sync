# Troubleshooting Guide - Nothing Displaying

## Common Issues and Solutions

### 1. Blank Screen / Nothing Displaying

#### Check Browser Console
Open browser DevTools (F12) and check for errors:
- JavaScript errors
- Network errors
- CORS errors

#### Verify Backend is Running
```bash
# Check if backend is running on port 8000
curl http://localhost:8000
# Should return: {"status": "Backend running"}
```

#### Verify Frontend is Running
```bash
cd frontend-new
npm run dev
# Should show: VITE ready in XXX ms, Local: http://localhost:5173
```

### 2. Installation Issues

#### Reinstall Dependencies
```bash
cd frontend-new
rm -rf node_modules
rm package-lock.json
npm install
```

#### Check Node Version
```bash
node --version
# Should be 18 or higher
```

### 3. Routing Issues

#### Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache completely

#### Check localStorage
Open browser console and run:
```javascript
localStorage.clear()
// Then refresh the page
```

### 4. API Connection Issues

#### Check API URL
Create `.env` file in `frontend-new/`:
```env
VITE_API_URL=http://localhost:8000
```

#### Verify CORS
Backend should have CORS enabled. Check `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Should allow all origins in dev
    ...
)
```

### 5. Authentication Issues

#### Test Login Directly
Navigate to: `http://localhost:5173/login`

#### Check Token Storage
In browser console:
```javascript
localStorage.getItem('token')
// Should return a JWT token if logged in
```

### 6. Component Not Rendering

#### Check if React is Loading
Add this to `src/main.jsx` temporarily:
```javascript
console.log('React app starting...')
```

#### Verify Tailwind CSS
Check if `src/index.css` has:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 7. MongoDB Connection

#### Verify MongoDB is Running
```bash
# Windows
net start MongoDB

# Or check if service is running
```

#### Check Database Connection
In `backend/app/db/database.py`, verify:
```python
MONGO_URI = "mongodb://localhost:27017"
```

### 8. Step-by-Step Debugging

1. **Start Backend First**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
   - Should see: "Application startup complete"
   - Visit: http://localhost:8000/docs (should show API docs)

2. **Start Frontend**
   ```bash
   cd frontend-new
   npm run dev
   ```
   - Should see: "Local: http://localhost:5173"
   - Visit: http://localhost:5173

3. **Check Network Tab**
   - Open DevTools → Network tab
   - Refresh page
   - Check if requests are being made
   - Check response status codes

4. **Check Console**
   - Open DevTools → Console tab
   - Look for errors (red text)
   - Check for warnings (yellow text)

### 9. Quick Fixes

#### Reset Everything
```bash
# Backend
cd backend
# Stop the server (Ctrl+C)

# Frontend
cd frontend-new
rm -rf node_modules
npm install
npm run dev
```

#### Check Port Conflicts
```bash
# Windows - Check if port 8000 is in use
netstat -ano | findstr :8000

# Windows - Check if port 5173 is in use
netstat -ano | findstr :5173
```

### 10. Expected Behavior

When everything works:
1. Visit `http://localhost:5173`
2. Should redirect to `/login` (if not logged in)
3. Login page should display
4. After login, redirects to `/dashboard`
5. Dashboard should show stats and quick actions

### 11. Common Error Messages

#### "Cannot GET /"
- Frontend routing issue
- Solution: Ensure React Router is set up correctly

#### "Network Error" or "CORS Error"
- Backend not running or CORS not configured
- Solution: Start backend, check CORS settings

#### "401 Unauthorized"
- Token expired or invalid
- Solution: Clear localStorage and login again

#### "Module not found"
- Missing dependencies
- Solution: Run `npm install` in frontend-new

### 12. Still Not Working?

1. **Check all services are running:**
   - MongoDB ✓
   - Backend (port 8000) ✓
   - Frontend (port 5173) ✓

2. **Verify file structure:**
   ```
   frontend-new/
     ├── src/
     │   ├── App.jsx
     │   ├── main.jsx
     │   ├── index.css
     │   └── ...
     ├── index.html
     └── package.json
   ```

3. **Test with minimal setup:**
   - Create a simple test component
   - Verify React is rendering

4. **Check browser compatibility:**
   - Use Chrome, Firefox, or Edge
   - Ensure JavaScript is enabled

### 13. Getting Help

If still having issues, provide:
1. Browser console errors (screenshot)
2. Network tab errors (screenshot)
3. Backend terminal output
4. Frontend terminal output
5. Steps you've taken



