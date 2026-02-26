# Setup Verification Checklist

## Step 1: Install Dependencies

```bash
cd frontend-new
npm install
```

**Expected output:** Should install all packages without errors.

## Step 2: Verify Backend is Running

Open a new terminal and run:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Test:** Visit http://localhost:8000 - should see `{"status": "Backend running"}`

## Step 3: Start Frontend

In the frontend-new directory:
```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Open Browser

Visit: **http://localhost:5173**

**Expected behavior:**
1. Should redirect to `/login` automatically
2. Login page should display with:
   - "SkillSync" heading
   - Email input field
   - Password input field
   - "Sign in" button
   - "Don't have an account? Register" link

## Step 5: Test Registration

1. Click "Don't have an account? Register"
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
3. Click "Register"

**Expected:** Should auto-login and redirect to dashboard

## Step 6: Verify Dashboard

After login, you should see:
- Sidebar with navigation
- Dashboard page with:
  - "Dashboard" heading
  - Stat cards (Goals, Tasks, Resources, Guidance)
  - Quick Actions section
  - System Overview section

## Common Issues

### Issue: Blank white screen

**Check:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

**Solutions:**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check if backend is running

### Issue: "Cannot GET /"

**Solution:** This is normal - React Router handles routing. Try navigating to `/login` directly.

### Issue: Network errors in console

**Check:**
1. Is backend running on port 8000?
2. Is CORS enabled in backend?
3. Check `VITE_API_URL` in `.env` file

### Issue: "Module not found"

**Solution:**
```bash
cd frontend-new
rm -rf node_modules
npm install
```

## Quick Test

If nothing displays, try this minimal test:

1. Open browser console (F12)
2. Type: `localStorage.clear()`
3. Refresh page
4. Should redirect to `/login`

## Still Not Working?

1. **Check all terminals:**
   - Backend terminal: Should show "Application startup complete"
   - Frontend terminal: Should show "Local: http://localhost:5173"

2. **Check browser:**
   - Open DevTools (F12)
   - Console tab: Any red errors?
   - Network tab: Any failed requests?

3. **Verify files exist:**
   ```
   frontend-new/
     ├── src/
     │   ├── App.jsx ✓
     │   ├── main.jsx ✓
     │   └── index.css ✓
     ├── index.html ✓
     └── package.json ✓
   ```

4. **Try different browser:**
   - Chrome
   - Firefox
   - Edge



