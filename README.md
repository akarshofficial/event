# ⏳ Event Countdown & Milestone Tracker

A modern, responsive full-stack event countdown and milestone management application built with **React** on the frontend and **Django REST Framework (DRF)** on the backend.

---

## 🚀 Features

- **Real-Time Dynamic Countdowns**: Days, Hours, Minutes, and Seconds countdown with live seconds pulsing indicator.
- **Milestone Status & Celebration**: Automatic "Event Arrived! 🎉" celebratory badge when a milestone target is reached.
- **Quick Preset Helpers**: Instant date-time helpers (`+1 Hour`, `Tomorrow`, `+1 Week`, `+1 Month`, `New Year`).
- **Live Search & Filter**: Real-time filtering by status (`All`, `Active`, `Arrived`) and title search.
- **One-Click Share**: Copy countdown summary to clipboard with a single click.
- **Secure JWT Authentication**: Powered by SimpleJWT with token refresh and automatic session expiration handling.
- **Vercel Deployment Ready**: Preconfigured with `vercel.json`, serverless WSGI handler (`api/index.py`), and dynamic frontend API proxying.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Axios, Pure CSS Design System (Plus Jakarta Sans & JetBrains Mono)
- **Backend**: Python 3.12, Django 6.x, Django REST Framework, SimpleJWT, WhiteNoise, CORS Headers
- **Deployment**: Vercel Serverless / Cloud Hosting

---

## 💻 Local Development Setup

### 1. Backend Setup (Django)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not created)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a superuser (optional, for admin and login)
python manage.py createsuperuser

# Start the Django development server
python manage.py runserver
```
The backend API will run at `http://127.0.0.1:8000/`.

### 2. Frontend Setup (React)

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start React app
npm start
```
The frontend UI will run at `http://localhost:3000/`.

---

## 🌐 Deploying to Vercel

### Option 1: Automatic Deployment via GitHub (Recommended)

1. Push your repository to GitHub (see instructions below).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. If deploying the **Frontend**:
   - Set **Root Directory** to `frontend`.
   - Add Environment Variable:
     - `REACT_APP_API_URL`: `https://your-backend-url.com/api/` (or your deployed API).
5. Click **Deploy**.

### Option 2: Deploy using Vercel CLI

```bash
# From the project root or frontend directory:
npx vercel
```
Follow the interactive prompts to link your Vercel account and deploy.

---

## 🐙 Push Directly to GitHub

To push this repository directly to your GitHub account:

```bash
# 1. Add your GitHub repository remote URL (replace with your repo URL):
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 2. Push directly to the main branch:
git push -u origin main
```

If you already have a remote named `origin`, you can update it with:
```bash
git remote set-url origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```
"# event" 
