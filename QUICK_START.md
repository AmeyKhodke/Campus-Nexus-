# 🚀 Campus Nexus - Quick Start

## FASTEST WAY TO RUN

### Step 1: Double-click this file
```
run-docker.bat
```

### Step 2: Wait for build (2-3 minutes first time)

### Step 3: Open browser
```
http://localhost:5173
```

---

## MANUAL COMMANDS (If batch file doesn't work)

Open Command Prompt in project folder:

```bash
# Build and start
docker-compose up --build

# Just start (if already built)
docker-compose up

# Stop (press Ctrl+C)
```

---

## TEST THE APP

1. Go to http://localhost:5173
2. Click "Sign Up"
3. Create account with:
   - Email: test@example.com
   - Password: Test@123
   - Role: Student (or Faculty/Admin)
   - Department: Computer Science

4. Explore:
   - **Student**: Elections, Budget, Facilities, Applications
   - **Faculty**: Administration, Fund Management, Approvals
   - **Admin**: System Health, User Management, Analytics

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Port 5173 in use | Change port in docker-compose.yml |
| Build fails | Run: `docker-compose build --no-cache` |
| Container exits | Run: `docker-compose logs` to see error |
| Changes not showing | Refresh browser (Ctrl+F5) |

---

## STOP THE APP

Press `Ctrl + C` in the terminal

---

## USEFUL COMMANDS

```bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Clean up
docker-compose down

# Full reset
docker-compose down -v
docker-compose up --build
```

---

## PROJECT INFO

- **Framework**: React 18 + Vite
- **Database**: Firebase
- **Styling**: Tailwind CSS
- **UI**: Radix UI Components
- **Charts**: Recharts

---

## FEATURES

✅ Multi-role dashboards (Student/Faculty/Admin)
✅ Elections management
✅ Budget & fund management
✅ Facility booking system
✅ Applications tracking
✅ Complaints & feedback
✅ Real-time notifications
✅ Analytics & reporting

---

**See SETUP_GUIDE.md for detailed instructions**
**See PRESENTATION.md for project overview**
