# SPIRE Enhanced Logging & Authentication Setup

This guide will help you set up the enhanced logging and authentication system for your SPIRE application.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Backend Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/spire

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Logging Configuration
LOG_LEVEL=info
LOG_RETENTION_DAYS=30

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Start MongoDB

If using local MongoDB:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001`

## Frontend Setup

### 1. Update Environment Variables

Add the following to your frontend `.env` file:

```env
REACT_APP_LOG_ENDPOINT=http://localhost:3001/api/logs
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### 2. Install Additional Dependencies

```bash
npm install @mui/x-date-pickers date-fns
```

### 3. Update Login Configuration

The login system now uses the local backend instead of the external API. Update the login endpoint in `src/modules/Login/Login.js`:

```javascript
// Change from:
const res = await fetch('https://visar.app/api/signup', {

// To:
const res = await fetch('http://localhost:3001/api/signup', {
```

## Features Overview

### Enhanced Logging System

The new logging system tracks:

- **User Actions**: Login attempts, successful logins, failed logins
- **Report Generation**: Generation attempts, success/failure, report metrics
- **Search Activity**: Search queries and results
- **Document Interactions**: Document selections, highlights, modifications
- **System Events**: Errors, warnings, and general system activities

### User Analytics Dashboard

Access user analytics at `/analytics` (you'll need to add this route):

- **Session Tracking**: Total sessions, active sessions, session duration
- **Activity Summary**: Most common actions, component usage
- **Daily Activity**: Activity patterns over time
- **Detailed Logs**: Filterable log entries with timestamps

### Authentication Features

- **JWT-based Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password hashing for security
- **Session Management**: Track user sessions and activity
- **User Registration**: Automatic user creation for new usernames

## Integration Points

### 1. Logger Integration

The logger is automatically integrated into key components:

- **Space2Think.js**: Report generation, search, document interactions
- **Login.js**: Authentication events
- **ChatBot.tsx**: Chat interactions (can be added)

### 2. Adding Logging to New Components

```javascript
import { logger } from '../utils/logger';

// Log user actions
await logger.logUserAction('custom_action', { detail: 'value' });

// Log errors
await logger.error('COMPONENT_NAME', 'error_type', { error: error.message });

// Log info
await logger.info('COMPONENT_NAME', 'action_name', { data: 'value' });
```

### 3. Session Management

Sessions are automatically created when users log in and can be ended when they log out:

```javascript
// Create session (automatic on login)
await fetch('http://localhost:3001/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        sessionId: sessionId,
        userId: username,
        userAgent: navigator.userAgent
    })
});

// End session (on logout)
await fetch(`http://localhost:3001/api/sessions/${sessionId}/end`, {
    method: 'PUT'
});
```

## API Endpoints

### Authentication
- `POST /api/signup` - User registration/login
- `GET /api/health` - Health check

### Logging
- `POST /api/logs` - Submit log entries
- `GET /api/logs/:userId` - Get user logs (with filters)

### Analytics
- `GET /api/analytics/:userId` - Get user analytics

### Sessions
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:sessionId/end` - End session

## Security Considerations

1. **JWT Secret**: Use a strong, unique JWT secret in production
2. **CORS**: Configure CORS origins properly for production
3. **Rate Limiting**: Consider adding rate limiting for API endpoints
4. **Data Retention**: Implement log rotation and cleanup policies
5. **HTTPS**: Use HTTPS in production environments

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/spire
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://yourdomain.com
LOG_RETENTION_DAYS=90
```

### Database Indexes

Create indexes for better performance:

```javascript
// In MongoDB shell or Mongoose
db.logs.createIndex({ "userId": 1, "timestamp": -1 })
db.logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 7776000 }) // 90 days
db.sessions.createIndex({ "userId": 1, "startTime": -1 })
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for remote MongoDB

2. **CORS Errors**
   - Check CORS_ORIGIN configuration
   - Ensure frontend URL matches CORS settings

3. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings

4. **Logging Not Working**
   - Check REACT_APP_LOG_ENDPOINT configuration
   - Verify backend server is running
   - Check browser console for network errors

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

## Next Steps

1. **Add Analytics Dashboard Route**: Integrate the UserAnalytics component into your routing
2. **Enhanced Security**: Add rate limiting and input validation
3. **Data Export**: Add functionality to export user logs and analytics
4. **Real-time Updates**: Implement WebSocket connections for real-time analytics
5. **Advanced Filtering**: Add more sophisticated log filtering and search capabilities 