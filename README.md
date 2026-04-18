# MatsenseAI - Backend & Deployment Guide

## Overview
Node.js/Express backend with:
- Form submission endpoint (`POST /api/submit`)
- Email notifications via SMTP (Hostinger)
- Database persistence (PostgreSQL on Railway, JSON file locally)
- Admin panel with JWT auth (`/admin`)

---

## Local Development

### 1. Install Dependencies
```powershell
cd server
npm install
```

### 2. Configure Environment
Edit `server/.env` and add your **Hostinger SMTP password**:
```
SMTP_PASS=YOUR_ACTUAL_HOSTINGER_PASSWORD
```

The admin password is already hashed (`Matsenseai@1122`).

### 3. Run Server
```powershell
npm start
```

Server runs at: **http://localhost:3000**

### 4. Test Endpoints
- Health: http://localhost:3000/api/ping
- Admin: http://localhost:3000/admin
  - Username: `admin`
  - Password: `Matsenseai@1122`

### 5. Update Frontend
The contact form at `contact.html` posts to `/api/submit`. For local testing with the static server:
- Serve frontend: `npx http-server . -p 5500` (from root)
- Form will POST to `http://localhost:3000/api/submit`

---

## Railway Deployment

### Step 1: Prepare Repository
1. Initialize git in your project root:
   ```powershell
   cd C:\Users\SIDDHARTHA\Downloads\atiqwebaite
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Push to GitHub:
   ```powershell
   # Create a new repo on GitHub (github.com/new)
   git remote add origin https://github.com/YOUR_USERNAME/matsenseai.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Railway
1. Go to **https://railway.app**
2. Sign up/login with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your `matsenseai` repository
5. Railway will auto-detect Node.js and deploy

### Step 3: Add PostgreSQL Database
1. In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically sets `DATABASE_URL` env var
3. Your backend will use Postgres instead of JSON file

### Step 4: Set Environment Variables
In Railway project settings → **Variables**, add:

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=Matsenseai@1122
SMTP_PASS=your_hostinger_smtp_password
FROM_EMAIL=info@matsenseai.co.uk
ADMIN_EMAILS=matsenseai@gmail.com,info@matsenseai.co.uk
ADMIN_USER=admin
ADMIN_PASS_HASH=$2a$10$Mx3/AaNKChbo2Seu3IrFf.filDdab.Crtqz1VLT4CPktYD4SpqHFm
ADMIN_JWT_SECRET=generate_random_string_for_production
```

**Note:** `DATABASE_URL` is automatically set by Railway when you add Postgres.

### Step 5: Configure Build & Start
Railway auto-detects `package.json`. Ensure your `server/package.json` has:
```json
{
  "scripts": {
    "start": "node index.js"
  }
}
```

Railway will run `npm install` then `npm start`.

### Step 6: Set Root Directory
If your backend is in `server/` folder:
1. Railway Settings → **Root Directory** → set to `server`
2. Redeploy

### Step 7: Get Your Backend URL
Railway provides a public URL like: `https://your-app.up.railway.app`

### Step 8: Update Frontend
Update `contact.html` to post to your Railway backend:

```javascript
// Replace localhost with your Railway URL
const API_URL = 'https://your-app.up.railway.app';
const res = await fetch(`${API_URL}/api/submit`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(data)
});
```

---

## Database Choice on Railway

### PostgreSQL (Recommended for Production)
- **Pros:** Reliable, scalable, ACID-compliant, Railway managed
- **How:** Add PostgreSQL addon in Railway (sets `DATABASE_URL` automatically)
- **Cost:** Railway free tier includes 500 hours/month (≈20 days)

### JSON File (Local Development Only)
- Used when `DATABASE_URL` is not set
- Not recommended for production (no concurrent write support)

---

## SMTP Configuration (Hostinger)

You have:
- **Email:** info@matsenseai.co.uk
- **SMTP User:** Matsenseai@1122
- **SMTP Pass:** (get from Hostinger control panel → Email → Password)

### Get Hostinger SMTP Password:
1. Login to Hostinger
2. Go to **Email** section
3. Find `info@matsenseai.co.uk` or your email account
4. Click **Manage** → **Email Accounts**
5. Use password or reset it

### Test SMTP Locally:
```powershell
# In server/.env, set SMTP_PASS=your_actual_password
# Then submit the contact form and check if emails are sent
```

---

## Admin Panel

### Access
- Local: http://localhost:3000/admin
- Railway: https://your-app.up.railway.app/admin

### Login
- Username: `admin`
- Password: `Matsenseai@1122`

### Features
- View all form submissions
- Click rows to see full details
- Copy email addresses
- Logout button

### Change Admin Password
Generate a new bcrypt hash:
```powershell
node gen-hash.js "your_new_password"
```
Copy the hash and update `ADMIN_PASS_HASH` in `.env` (local) or Railway variables.

---

## API Endpoints

### `GET /api/ping`
Health check
```json
{"ok": true}
```

### `POST /api/submit`
Submit contact form
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+44...",
  "company": "Acme Ltd",
  "role": "Founder",
  "services": "Website Design, Development",
  "budget": "€10–30k",
  "timeline": "Q3 · 2026",
  "message": "We need a new website..."
}
```

**Response:**
```json
{"ok": true}
```

**Email Flow:**
1. Thank-you email sent to submitter
2. Notification email sent to `matsenseai@gmail.com` and `info@matsenseai.co.uk`
3. Submission saved to database

### `POST /admin/login`
Admin authentication
```json
{"username": "admin", "password": "Matsenseai@1122"}
```

**Response:**
```json
{"ok": true, "token": "jwt_token_here"}
```

### `GET /admin/submissions`
Get all submissions (requires JWT token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "rows": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-04-18T22:30:00.000Z",
      ...
    }
  ]
}
```

---

## Troubleshooting

### "Cannot find module" errors
```powershell
cd server
npm install
```

### SMTP errors (local)
- Check `SMTP_PASS` in `.env` is correct
- Verify Hostinger SMTP settings
- Try port 465 with `SMTP_SECURE=true`

### Railway deployment fails
- Check build logs in Railway dashboard
- Ensure `ROOT_DIRECTORY` is set to `server` if backend is in subfolder
- Verify all env vars are set

### Database errors on Railway
- Ensure PostgreSQL addon is added
- Check `DATABASE_URL` is set in Railway variables (should be automatic)

### CORS errors
Add CORS middleware to `server/index.js`:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

---

## Cost Estimates (Railway)

- **Hobby Plan (Free):**
  - $5 free credit/month
  - 500 execution hours
  - Good for low-traffic sites

- **Paid Plan:**
  - $5/month base
  - Pay for usage (CPU/RAM)
  - PostgreSQL addon: ~$5-10/month

For a contact form with ~100 submissions/month, free tier should be sufficient.

---

## Security Notes

1. **Never commit `.env` to git** - already in `.gitignore`
2. Change `ADMIN_JWT_SECRET` to a random string in production
3. Use bcrypt hash for admin password (already done)
4. Railway env vars are encrypted
5. Consider rate limiting for `/api/submit` in production

---

## Next Steps

1. ✅ Backend implemented
2. ✅ Admin panel ready
3. ⏳ Add Hostinger SMTP password to `.env`
4. ⏳ Test form submission locally
5. ⏳ Deploy to Railway
6. ⏳ Update frontend API URL to Railway backend
7. ⏳ Test production submission & emails

---

## Support

For issues:
- Railway docs: https://docs.railway.app
- Hostinger SMTP: https://support.hostinger.com/en/articles/1583298-how-to-use-hostinger-smtp
- Node mailer: https://nodemailer.com/

---

**Generated: April 18, 2026**
