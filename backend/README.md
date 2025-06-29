# Backend API Documentation

A robust, modular, and scalable Node.js backend server with Express and PostgreSQL, featuring user authentication and role-based access control.

## Features

- **Modern Architecture**: Clean separation of concerns with controllers, services, and models
- **Authentication**: JWT-based authentication with secure password hashing
- **Authorization**: Role-based access control (Admin, Manager, Employee)
- **Database**: PostgreSQL with connection pooling and prepared statements
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Logging**: Structured logging with Winston
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Validation**: Input validation using Joi

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration and connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication endpoints
│   │   └── userController.js    # User management endpoints
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── rbac.js              # Role-based access control
│   │   └── errorHandler.js      # Global error handling
│   ├── models/
│   │   └── User.js              # User database model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   └── users.js             # User management routes
│   ├── services/
│   │   ├── authService.js       # Authentication business logic
│   │   └── userService.js       # User management business logic
│   ├── utils/
│   │   ├── auth.js              # Authentication utilities
│   │   ├── logger.js            # Winston logger configuration
│   │   └── validation.js        # Joi validation schemas
│   └── app.js                   # Express app configuration
├── logs/                        # Log files directory
├── env.example                  # Environment variables template
├── index.js                     # Server entry point
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Prerequisites

- Node.js (>= 18.0.0)
- PostgreSQL (>= 12.0)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=inventory_db
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d
   
   # Security
   BCRYPT_ROUNDS=12
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE inventory_db;
   ```

5. **Create logs directory**
   ```bash
   mkdir logs
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Logout User
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <jwt_token>
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <jwt_token>
```

### User Management Endpoints

#### Get All Users (Admin Only)
```http
GET /api/users?page=1&limit=10&role=admin&search=john
Authorization: Bearer <admin_jwt_token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <jwt_token>
```

#### Update User Profile
```http
PUT /api/users/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com"
}
```

#### Update User Role (Admin Only)
```http
PUT /api/users/:id/role
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "role": "manager"
}
```

#### Delete User (Admin Only)
```http
DELETE /api/users/:id
Authorization: Bearer <admin_jwt_token>
```

#### Change Password
```http
POST /api/users/:id/change-password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

#### Update User Status (Admin Only)
```http
PUT /api/users/:id/status
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "isActive": false
}
```

## User Roles and Permissions

### Admin
- Full access to all user management operations
- Can create, read, update, and delete users
- Can change user roles
- Can activate/deactivate user accounts

### Manager
- Can view user profiles
- Can access reports (when implemented)
- Cannot modify user roles or delete users

### Employee
- Can view and update own profile
- Can change own password
- Limited access to system features

## Authentication Flow

1. **Registration**: User provides email, password, and profile information
2. **Login**: User provides email and password, receives JWT token
3. **Authorization**: Include JWT token in Authorization header for protected routes
4. **Token Refresh**: Use refresh endpoint to get new token before expiration
5. **Logout**: Invalidate session (token blacklisting can be implemented)

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional validation errors
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

## Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Joi schemas for request validation
- **SQL Injection Prevention**: Parameterized queries
- **CORS**: Configurable cross-origin requests
- **Security Headers**: Helmet middleware for security headers

## Development

### Scripts
```bash
npm run dev        # Start development server with nodemon
npm start          # Start production server
npm test           # Run tests (when implemented)
```

### Database Schema

The system automatically creates the following table:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Logging

Logs are written to:
- `logs/error.log`: Error level logs
- `logs/combined.log`: All logs
- Console output in development mode

## Contributing

1. Follow the existing code structure and patterns
2. Add proper error handling and logging
3. Include input validation for new endpoints
4. Update documentation for new features
5. Test thoroughly before committing

## License

This project is licensed under the ISC License. 