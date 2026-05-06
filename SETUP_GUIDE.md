# Campus Nexus - Setup & Run Guide

## Quick Start (Recommended - Using Docker)

Since you have Docker installed, follow these steps:

### Option 1: Using the Batch Script (Easiest)

1. **Double-click** `run-docker.bat` in the project folder
2. Wait for the build to complete
3. Open your browser and go to: **http://localhost:5173**

### Option 2: Manual Docker Commands

Open Command Prompt in the project directory and run:

```bash
# Build the Docker image
docker-compose build

# Start the application
docker-compose up
```

Then open: **http://localhost:5173**

---

## What Happens When You Run It

1. Docker pulls Node.js 24-slim image
2. Installs all npm dependencies
3. Starts Vite development server
4. Application runs on port 5173
5. Hot Module Replacement (HMR) enabled for live updates

---

## Accessing the Application

### Development Server
- **URL**: http://localhost:5173
- **Features**: 
  - Live reload on file changes
  - Hot Module Replacement (HMR)
  - Development tools enabled

### Default Test Credentials
Create a new account via the signup page:
- **Role**: Student / Faculty / Admin
- **Email**: Any valid email
- **Password**: Any secure password

---

## Common Commands

### Start Development Server
```bash
docker-compose up
```

### Stop the Application
Press `Ctrl + C` in the terminal

### Rebuild After Dependency Changes
```bash
docker-compose build --no-cache
docker-compose up
```

### View Logs
```bash
docker-compose logs -f
```

### Remove Containers
```bash
docker-compose down
```

### Clean Everything (including images)
```bash
docker-compose down -v
docker image rm campus-nexus-app
```

---

## Troubleshooting

### Port 5173 Already in Use
```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port in docker-compose.yml
# Change "5173:5173" to "5174:5173"
```

### Docker Build Fails
```bash
# Clear Docker cache and rebuild
docker-compose build --no-cache
```

### Container Exits Immediately
```bash
# Check logs
docker-compose logs

# Rebuild and run with verbose output
docker-compose up --build
```

### Permission Denied Errors
Run Command Prompt as Administrator

---

## Project Structure

```
Campus-Nexus-/
├── src/
│   ├── components/
│   │   ├── dashboards/        # Student, Faculty, Admin dashboards
│   │   ├── features/          # Elections, Budget, Facilities, etc.
│   │   ├── layout/            # Navigation and layout components
│   │   └── ui/                # Reusable UI components
│   ├── services/              # Firebase and API services
│   ├── config/                # Firebase configuration
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── App.jsx                # Main app component
│   └── main.jsx               # Entry point
├── public/                    # Static assets
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose configuration
├── package.json               # Dependencies
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── README.md                  # Project documentation
```

---

## Features Available

### Student Dashboard
- View elections and vote
- Submit budget requests
- Book facilities
- Submit applications
- Send feedback/complaints
- View announcements

### Faculty Dashboard
- Administer elections
- Manage department budget
- Approve facility bookings
- Review applications
- View student feedback
- Create announcements

### Admin Dashboard
- System health monitoring
- User management
- Overall budget oversight
- System alerts and logs
- Performance analytics
- User activity tracking

---

## Technology Stack

- **Frontend**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: Radix UI
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Charts**: Recharts 2.15.3
- **Runtime**: Node.js 24 (in Docker)

---

## Firebase Configuration

The project is pre-configured with Firebase:
- **Project ID**: campus-nexus-7cc6d
- **Database**: Realtime Database
- **Authentication**: Email/Password + Google OAuth
- **Storage**: Cloud Storage for files

No additional configuration needed!

---

## Development Workflow

1. **Make changes** to files in `src/`
2. **Save the file** - Vite will automatically reload
3. **Check browser** at http://localhost:5173
4. **View console** for any errors or warnings

---

## Building for Production

```bash
# Build optimized production bundle
docker-compose exec campus-nexus npm run build

# Preview production build
docker-compose exec campus-nexus npm run preview
```

Output will be in the `dist/` folder.

---

## Need Help?

### Check Logs
```bash
docker-compose logs -f campus-nexus
```

### Restart Container
```bash
docker-compose restart
```

### Full Reset
```bash
docker-compose down -v
docker-compose up --build
```

---

## Next Steps

1. ✅ Run the application using `run-docker.bat`
2. ✅ Open http://localhost:5173 in your browser
3. ✅ Create a test account (Student/Faculty/Admin)
4. ✅ Explore the dashboards and features
5. ✅ Check the PRESENTATION.md for project overview

---

**Happy Coding! 🚀**

For more information, see PRESENTATION.md for the complete project overview.
