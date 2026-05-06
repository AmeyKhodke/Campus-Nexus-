# Campus Nexus

> A comprehensive, role-based campus management system designed to streamline administrative, academic, and student activities within educational institutions.

[![GitHub license](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/AmeyKhodke/Campus-Nexus-?style=social)](https://github.com/AmeyKhodke/Campus-Nexus-)
[![GitHub forks](https://img.shields.io/github/forks/AmeyKhodke/Campus-Nexus-?style=social)](https://github.com/AmeyKhodke/Campus-Nexus-)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Campus Nexus is a unified digital ecosystem that connects students, faculty, and administrators through an intuitive, feature-rich platform. It serves as a centralized hub for all campus operations, from elections and budget management to facility bookings and complaint resolution.

### Key Problems Solved

- ✅ Fragmented campus management across multiple systems
- ✅ Lack of real-time communication and notifications
- ✅ Inefficient resource allocation and facility booking
- ✅ Limited transparency in budget and fund management
- ✅ Difficulty in organizing campus elections
- ✅ Absence of centralized complaint mechanisms

## ✨ Features

### 🎓 Student Features
- **Elections**: Participate in campus elections with real-time voting
- **Budget Management**: Submit and track budget requests
- **Facility Booking**: Reserve campus facilities with availability checking
- **Applications**: Submit and track various campus applications
- **Complaints & Feedback**: Report issues and provide feedback
- **Announcements**: Stay updated with campus news and events

### 👨‍🏫 Faculty Features
- **Election Administration**: Create and manage campus elections
- **Fund Management**: Oversee departmental budgets and allocations
- **Facility Management**: Approve and manage facility bookings
- **Application Review**: Review and process student applications
- **Complaint Resolution**: Address student complaints and feedback
- **Announcements**: Broadcast important information to students

### 🔐 Admin Features
- **System Monitoring**: Real-time system health and performance metrics
- **User Management**: Create, edit, and manage user accounts
- **Budget Oversight**: Monitor institution-wide budget allocation
- **Analytics & Reporting**: Comprehensive system analytics and reports
- **System Alerts**: Receive and manage critical system notifications
- **Audit Logs**: Track all system activities for compliance

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI library
- **Vite** 5.0.8 - Build tool and dev server
- **Tailwind CSS** 3.4.1 - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **React Router** 6.22.0 - Client-side routing
- **Recharts** 2.15.3 - Data visualization

### Backend & Database
- **Firebase Authentication** - User authentication
- **Firebase Realtime Database** - Real-time data synchronization
- **Firebase Analytics** - Usage analytics
- **Cloudinary** - Image storage and management

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **React Hook Form** - Form management
- **Zod** - Schema validation

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git installed
- Modern web browser

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/AmeyKhodke/Campus-Nexus-.git
   cd Campus-Nexus-
   git checkout soham
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Open in browser**
   ```
   http://localhost:5173
   ```

### Using Batch Script (Windows)

Simply double-click `run-docker.bat` in the project folder.

## 📦 Installation

### Local Setup (Without Docker)

1. **Install Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Clone the repository**
   ```bash
   git clone https://github.com/AmeyKhodke/Campus-Nexus-.git
   cd Campus-Nexus-
   git checkout soham
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 💻 Usage

### Creating Test Accounts

1. Navigate to http://localhost:5173
2. Click "Sign Up"
3. Fill in the registration form:
   - **Email**: test@example.com
   - **Password**: Test@123456
   - **Role**: Student / Faculty / Admin
   - **Department**: Computer Science
   - **Student ID** (if Student): CS001

4. Click "Create Account"
5. You'll be redirected to your role-specific dashboard

### Exploring Features

#### As a Student
- View and participate in elections
- Submit budget requests
- Book facilities
- Submit applications
- Send feedback

#### As Faculty
- Create and manage elections
- Review and approve requests
- Manage facility bookings
- Review student applications
- Create announcements

#### As Admin
- Monitor system health
- Manage all users
- View system analytics
- Handle system alerts
- Generate reports

## 📁 Project Structure

```
Campus-Nexus-/
├── src/
│   ├── components/
│   │   ├── dashboards/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── FacultyDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── features/
│   │   │   ├── Elections/
│   │   │   ├── Budget/
│   │   │   ├── Facilities/
│   │   │   ├── Applications/
│   │   │   ├── Complaints/
│   │   │   └── FundManagement/
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── StudentMenu.jsx
│   │   │   ├── FacultyMenu.jsx
│   │   │   └── AdminLayout.jsx
│   │   └── ui/
│   │       └── [Radix UI components]
│   ├── services/
│   │   ├── firebaseAuth.service.js
│   │   ├── application.service.js
│   │   ├── election.service.js
│   │   └── facility.service.js
│   ├── config/
│   │   └── firebase.js
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useToast.jsx
│   ├── App.jsx
│   └── main.jsx
├── public/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## ⚙️ Configuration

### Firebase Setup

The project is pre-configured with Firebase. Configuration is located in `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "campus-nexus-7cc6d.firebaseapp.com",
  databaseURL: "https://campus-nexus-7cc6d-default-rtdb.firebaseio.com",
  projectId: "campus-nexus-7cc6d",
  storageBucket: "campus-nexus-7cc6d.firebasestorage.app",
  messagingSenderId: "294521872172",
  appId: "1:294521872172:web:33e77d391c2d6967d15689"
};
```

### Environment Variables

No `.env` file is required. All configuration is handled through Firebase console.

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Development Workflow

1. Create a new branch for your feature
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Test locally
4. Commit with descriptive messages
   ```bash
   git commit -m "feat: add new feature"
   ```

5. Push to your branch
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request

### Code Style

- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Keep components small and focused

## 🐛 Troubleshooting

### Port 5173 Already in Use

```bash
# Windows - Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
# Change "5173:5173" to "5174:5173"
```

### Docker Build Fails

```bash
# Clear cache and rebuild
docker-compose build --no-cache
docker-compose up
```

### Blank Page on Load

1. Hard refresh browser (Ctrl+F5)
2. Clear browser cache
3. Check browser console for errors (F12)
4. Restart Docker container

### Firebase Connection Issues

1. Check internet connection
2. Verify Firebase credentials in `src/config/firebase.js`
3. Check Firebase console for any service disruptions
4. Review browser console for specific error messages

### Container Exits Immediately

```bash
# Check logs
docker-compose logs

# Rebuild with verbose output
docker-compose up --build
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request**

### Contribution Guidelines

- Write clear, descriptive commit messages
- Update documentation for new features
- Test your changes thoroughly
- Follow the existing code style
- Add comments for complex logic

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Amedeo Khodke** - Initial work - [GitHub](https://github.com/AmeyKhodke)

## 🙏 Acknowledgments

- React and Vite communities
- Firebase for backend services
- Tailwind CSS for styling
- Radix UI for accessible components
- All contributors and testers

## 📞 Support

For support, email support@campusnexus.com or open an issue on [GitHub Issues](https://github.com/AmeyKhodke/Campus-Nexus-/issues).

## 🔗 Links

- [GitHub Repository](https://github.com/AmeyKhodke/Campus-Nexus-)
- [Project Documentation](./SETUP_GUIDE.md)
- [Firebase Console](https://console.firebase.google.com/)

---

**Made with ❤️ for campus communities**
