# Campus Nexus - Setup & Installation Guide

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Running the Application](#running-the-application)
- [First Time Setup](#first-time-setup)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)
- [Troubleshooting](#troubleshooting)
- [Development Workflow](#development-workflow)

---

## 🚀 Quick Start

### Fastest Way (Using Docker)

1. **Double-click** `run-docker.bat` (Windows)
2. Wait for build to complete (2-3 minutes first time)
3. Open browser: **http://localhost:5173**
4. Create test account and explore!

### Manual Docker Commands

```bash
# Build and start
docker-compose up --build

# Just start (if already built)
docker-compose up

# Stop (press Ctrl+C)
```

---

## ✅ Prerequisites

### Required
- **Docker & Docker Compose** (for containerized setup)
  - Download: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Git** (for version control)
  - Download: [Git](https://git-scm.com/)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### Optional (for local development without Docker)
- **Node.js** v16 or higher
  - Download: [Node.js](https://nodejs.org/)
- **npm** (comes with Node.js)

---

## 📦 Installation Methods

### Method 1: Docker (Recommended)

#### Step 1: Clone Repository
```bash
git clone https://github.com/AmeyKhodke/Campus-Nexus-.git
cd Campus-Nexus-
git checkout soham
```

#### Step 2: Build Docker Image
```bash
docker-compose build
```

#### Step 3: Start Container
```bash
docker-compose up
```

#### Step 4: Access Application
Open browser and navigate to: **http://localhost:5173**

---

### Method 2: Local Setup (Without Docker)

#### Step 1: Clone Repository
```bash
git clone https://github.com/AmeyKhodke/Campus-Nexus-.git
cd Campus-Nexus-
git checkout soham
```

#### Step 2: Install Node.js
- Download and install from [nodejs.org](https://nodejs.org/)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

#### Step 3: Install Dependencies
```bash
npm install
```

#### Step 4: Start Development Server
```bash
npm run dev
```

#### Step 5: Access Application
Open browser and navigate to: **http://localhost:5173**

---

### Method 3: Windows Batch Script

#### Step 1: Navigate to Project Folder
```
G:\Third Year\WTL-Project\Campus-Nexus-
```

#### Step 2: Double-click `run-docker.bat`
- Automatically builds Docker image
- Starts the container
- Opens development server

#### Step 3: Access Application
Browser will open automatically or navigate to: **http://localhost:5173**

---

## 🎯 Running the Application

### Development Server

The application runs on **http://localhost:5173** with:
- ✅ Live reload on file changes
- ✅ Hot Module Replacement (HMR)
- ✅ Development tools enabled
- ✅ Source maps for debugging

### Production Build

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

Output will be in the `dist/` folder.

---

## 🔧 First Time Setup

### Creating Test Accounts

#### Step 1: Access Sign Up Page
1. Open http://localhost:5173
2. Click "Sign Up" button

#### Step 2: Fill Registration Form

**For Student Account:**
```
First Name:     John
Last Name:      Doe
Email:          john@example.com
Password:       Test@123456
Role:           Student
Department:     Computer Science
Student ID:     CS001
```

**For Faculty Account:**
```
First Name:     Jane
Last Name:      Smith
Email:          jane@example.com
Password:       Test@123456
Role:           Faculty
Department:     Mathematics
Faculty ID:     FAC001
```

**For Admin Account:**
```
First Name:     Admin
Last Name:      User
Email:          admin@example.com
Password:       Test@123456
Role:           Admin
Department:     IT Administration
```

#### Step 3: Create Account
Click "Create Account" button

#### Step 4: Explore Dashboard
You'll be redirected to your role-specific dashboard

---

## 📁 Project Structure

```
Campus-Nexus-/
├── src/
│   ├── components/
│   │   ├── dashboards/
│   │   │   ├── StudentDashboard.jsx      # Student interface
│   │   │   ├── FacultyDashboard.jsx      # Faculty interface
│   │   │   └── AdminDashboard.jsx        # Admin interface
│   │   ├── features/
│   │   │   ├── Elections/                # Election management
│   │   │   ├── Budget/                   # Budget requests
│   │   │   ├── Facilities/               # Facility booking
│   │   │   ├── Applications/             # Application tracking
│   │   │   ├── Complaints/               # Complaint system
│   │   │   └── FundManagement/           # Fund management
│   │   ├── layout/
│   │   │   ├── Layout.jsx                # Main layout
│   │   │   ├── StudentMenu.jsx           # Student navigation
│   │   │   ├── FacultyMenu.jsx           # Faculty navigation
│   │   │   └── AdminLayout.jsx           # Admin layout
│   │   └── ui/
│   │       └── [Radix UI components]     # Reusable components
│   ├── services/
│   │   ├── firebaseAuth.service.js       # Authentication
│   │   ├── application.service.js        # Applications
│   │   ├── election.service.js           # Elections
│   │   └── facility.service.js           # Facilities
│   ├── config/
│   │   └── firebase.js                   # Firebase config
│   ├── contexts/
│   │   └── AuthContext.jsx               # Auth context
│   ├── hooks/
│   │   ├── useAuth.js                    # Auth hook
│   │   └── useToast.jsx                  # Toast hook
│   ├── App.jsx                           # Main app
│   └── main.jsx                          # Entry point
├── public/                               # Static assets
├── Dockerfile                            # Docker config
├── docker-compose.yml                    # Docker Compose
├── package.json                          # Dependencies
├── vite.config.js                        # Vite config
├── tailwind.config.js                    # Tailwind config
└── README.md                             # Documentation
```

---

## 🔨 Available Commands

### Development

```bash
# Start development server with HMR
npm run dev

# Run ESLint to check code quality
npm run lint
```

### Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Docker Commands

```bash
# Build Docker image
docker-compose build

# Start container
docker-compose up

# Start with rebuild
docker-compose up --build

# Stop container
docker-compose down

# View logs
docker-compose logs -f

# Restart container
docker-compose restart

# Clean up everything
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Issue: Port 5173 Already in Use

**Solution 1: Kill Process**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Solution 2: Change Port**
Edit `docker-compose.yml`:
```yaml
ports:
  - "5174:5173"  # Use 5174 instead
```

### Issue: Docker Build Fails

```bash
# Clear cache and rebuild
docker-compose build --no-cache
docker-compose up
```

### Issue: Blank Page on Load

1. **Hard refresh browser**
   - Windows/Linux: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Clear browser cache**
   - Open DevTools: `F12`
   - Right-click refresh button → "Empty cache and hard refresh"

3. **Check browser console**
   - Press `F12` → Console tab
   - Look for red error messages

4. **Restart Docker**
   ```bash
   docker-compose restart
   ```

### Issue: Firebase Connection Error

1. Check internet connection
2. Verify Firebase credentials in `src/config/firebase.js`
3. Check [Firebase Console](https://console.firebase.google.com/)
4. Review browser console for specific errors

### Issue: Container Exits Immediately

```bash
# Check logs for error details
docker-compose logs

# Rebuild with verbose output
docker-compose up --build
```

### Issue: Changes Not Reflecting

1. Save file (Ctrl+S)
2. Wait for Vite to recompile
3. Refresh browser (F5)
4. Check console for errors (F12)

---

## 💻 Development Workflow

### Making Changes

1. **Edit files** in `src/` directory
2. **Save file** - Vite automatically recompiles
3. **Check browser** - Page auto-refreshes
4. **View console** - Check for errors (F12)

### Creating New Features

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** to relevant files

3. **Test locally**
   ```bash
   npm run dev
   ```

4. **Commit changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **Push to branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request** on GitHub

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix
```

---

## 🔐 Firebase Configuration

### Pre-configured Settings

The project is pre-configured with Firebase:

- **Project ID**: campus-nexus-7cc6d
- **Database**: Realtime Database
- **Authentication**: Email/Password + Google OAuth
- **Storage**: Cloud Storage

### Configuration File

Located at: `src/config/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD0yCMkXuobsQMos8StBpScxRMyVvrs1GY",
  authDomain: "campus-nexus-7cc6d.firebaseapp.com",
  databaseURL: "https://campus-nexus-7cc6d-default-rtdb.firebaseio.com",
  projectId: "campus-nexus-7cc6d",
  storageBucket: "campus-nexus-7cc6d.firebasestorage.app",
  messagingSenderId: "294521872172",
  appId: "1:294521872172:web:33e77d391c2d6967d15689"
};
```

**No additional configuration needed!**

---

## 📊 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Frontend** | React | 18.2.0 |
| **Build Tool** | Vite | 5.0.8 |
| **Styling** | Tailwind CSS | 3.4.1 |
| **UI Components** | Radix UI | Latest |
| **Routing** | React Router | 6.22.0 |
| **Charts** | Recharts | 2.15.3 |
| **Database** | Firebase | 10.14.1 |
| **Authentication** | Firebase Auth | 10.14.1 |
| **Runtime** | Node.js | 24 (Docker) |

---

## 🎓 Features Overview

### Student Dashboard
- ✅ View and participate in elections
- ✅ Submit budget requests
- ✅ Book campus facilities
- ✅ Submit applications
- ✅ Send feedback/complaints
- ✅ View announcements

### Faculty Dashboard
- ✅ Create and manage elections
- ✅ Review budget requests
- ✅ Approve facility bookings
- ✅ Review applications
- ✅ Address complaints
- ✅ Create announcements

### Admin Dashboard
- ✅ Monitor system health
- ✅ Manage users
- ✅ View analytics
- ✅ Handle alerts
- ✅ Generate reports
- ✅ Audit logs

---

## 📞 Support & Help

### Getting Help

1. **Check this guide** - Most issues are covered in Troubleshooting
2. **Check browser console** - Press F12 for error details
3. **Check Docker logs** - Run `docker-compose logs -f`
4. **Open GitHub Issue** - [Create an issue](https://github.com/AmeyKhodke/Campus-Nexus-/issues)

### Useful Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com/)

---

## 🎉 Next Steps

1. ✅ Follow Quick Start section above
2. ✅ Create test accounts for different roles
3. ✅ Explore each dashboard
4. ✅ Test different features
5. ✅ Read README.md for project overview
6. ✅ Start contributing!

---

**Happy coding! 🚀**

For more information, see [README.md](./README.md) for the complete project overview.
