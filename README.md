# MediBook Offline - Frontend

This is the React-based frontend application for the MediBook Offline medical booking system. It provides a user-friendly interface for patients, doctors, and administrators to manage appointments, medical records, and system administration.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [Available Scripts](#available-scripts)
- [Pages & Routes](#pages--routes)
- [Services](#services)
- [Components](#components)
- [Styling](#styling)
- [Environment Configuration](#environment-configuration)
- [Contributing](#contributing)

## ✨ Features

- **Multi-Role Dashboard**: Dedicated dashboards for Patients, Doctors, and Administrators
- **User Authentication**: Login and signup with OAuth support
- **Responsive Design**: Mobile-friendly interface using modern CSS
- **API Integration**: Seamless communication with backend microservices
- **Navigation**: Easy-to-use navigation bar with role-based access
- **Session Management**: Secure authentication state management

## 🛠 Tech Stack

- **Framework**: React 19.2.4
- **Language**: JavaScript (JSX) 
- **Build Tool**: Vite 8.0.4
- **Routing**: React Router DOM 7.14.0
- **UI Components**: Lucide React 1.8.0 (icons)
- **Linting**: ESLint 9.39.4
- **Package Manager**: npm

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/                    # Page components for different views
│   │   ├── Home.jsx             # Landing/home page
│   │   ├── Login.jsx            # User login page
│   │   ├── Signup.jsx           # User registration page
│   │   ├── PatientDashboard.jsx # Patient-specific dashboard
│   │   ├── DoctorDashboard.jsx  # Doctor-specific dashboard
│   │   ├── AdminDashboard.jsx   # Admin-specific dashboard
│   │   └── OAuthSuccess.jsx     # OAuth callback handler
│   ├── components/              # Reusable React components
│   │   └── Navbar.jsx           # Navigation component
│   ├── services/                # API and auth services
│   │   ├── api.js              # API client configuration and calls
│   │   └── auth.js             # Authentication logic
│   ├── assets/                  # Static assets (images, etc.)
│   ├── App.jsx                 # Root application component
│   ├── App.css                 # Application styles
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── public/                      # Static files
├── index.html                   # HTML template
├── vite.config.ts              # Vite configuration
├── eslint.config.js            # ESLint configuration
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 📋 Prerequisites

- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **Backend Services**: Ensure the API Gateway and other backend microservices are running

## 🚀 Installation

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API endpoints** (if needed):
   - Update API base URL in `src/services/api.js` to match your backend server
   - Default configuration assumes backend is running on `http://localhost:8080`

## 💻 Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Features**:
- Hot reload on file changes
- Fast refresh with React plugin
- Development server with sourcemaps

## 🏗 Building

Build the application for production:

```bash
npm run build
```

Output is generated in the `dist/` directory and is ready for deployment.

**Build Process**:
- Minification and optimization
- TypeScript compilation
- Asset bundling
- Production-ready output

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

## 🛣 Pages & Routes

The application includes the following main pages:

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Landing page with overview |
| Login | `/login` | User authentication page |
| Signup | `/signup` | New user registration page |
| Patient Dashboard | `/patient-dashboard` | Dashboard for patients to book appointments |
| Doctor Dashboard | `/doctor-dashboard` | Dashboard for doctors to manage schedules |
| Admin Dashboard | `/admin-dashboard` | Dashboard for system administrators |
| OAuth Success | `/oauth-success` | OAuth callback handler |

## 🔧 Services

### api.js
Handles all HTTP requests to backend services:
- API client configuration with base URL
- Request interceptors for authentication
- Response handling and error management

### auth.js
Manages user authentication:
- Login/Logout functionality
- Token management
- OAuth integration
- Session persistence

## 🧩 Components

### Navbar.jsx
Main navigation component featuring:
- Router navigation links
- Role-based menu items
- User session information
- Logout functionality

## 🎨 Styling

The application uses CSS for styling with two main files:

- **`index.css`**: Global styles and CSS variables
- **`App.css`**: Application-specific styles

**Note**: Consider migrating to CSS-in-JS (styled-components) or Tailwind CSS for larger applications.

## ⚙️ Environment Configuration

The frontend connects to backend services through the API Gateway. Ensure the following:

1. **Backend URL**: Update `src/services/api.js` with the correct backend URL
   - Development: `http://localhost:8080`
   - Production: Update to production API Gateway URL

2. **OAuth Configuration**: If using OAuth, configure OAuth provider credentials

3. **CORS Settings**: Ensure backend CORS settings allow requests from frontend origin

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test thoroughly
3. Run linting: `npm run lint`
4. Commit your changes with clear messages
5. Push to the branch and create a Pull Request

## 📚 References

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [React Router Documentation](https://reactrouter.com)
- [ESLint Documentation](https://eslint.org)

---
