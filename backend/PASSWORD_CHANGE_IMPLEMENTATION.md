# Password Change Implementation

## Overview

Comprehensive password change functionality has been implemented for the
inventory management system. This includes both backend API endpoints and
frontend integration.

## Backend Implementation

### API Endpoints

#### 1. Change Current User's Password

```
POST /api/users/change-password
```

- **Authentication**: Required (Bearer token)
- **Access**: Own profile only
- **Body**:
  ```json
  {
    "currentPassword": "current_password_here",
    "newPassword": "new_password_here"
  }
  ```

#### 2. Change Any User's Password (Admin)

```
POST /api/users/:id/change-password
```

- **Authentication**: Required (Bearer token)
- **Access**: User can only change their own password
- **Parameters**: `id` - User ID
- **Body**: Same as above

### Validation Rules

#### Password Requirements

- **Minimum Length**: 6 characters
- **Maximum Length**: 128 characters
- **Restrictions**:
  - Cannot be the same as current password
  - Current password must be correct
  - User account must be active

#### Request Validation

- Uses Joi schema validation
- Validates both `currentPassword` and `newPassword` fields
- Returns detailed error messages for validation failures

### Security Features

1. **Password Hashing**: Uses bcrypt with configurable salt rounds
2. **Current Password Verification**: Validates current password before allowing
   change
3. **Duplicate Prevention**: Prevents changing to the same password
4. **Account Status Check**: Only active users can change passwords
5. **Rate Limiting**: Applied at application level
6. **JWT Authentication**: Secure token-based authentication

### Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Validation errors, incorrect current password
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server-side errors

### Example Responses

#### Success Response

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

## Frontend Integration

### API Client

- Added `changePassword` method to `AuthAPI` class
- Located in `frontend/src/data/auth.api.ts`
- Handles API communication and error responses

### UI Components

- Integrated into Settings page (`SettingsPage.tsx`)
- Features:
  - Separate password fields (current, new, confirm)
  - Password visibility toggles with eye icons
  - Client-side validation
  - Loading states during API calls
  - Success/error feedback

### Validation Flow

1. **Frontend Validation**:
   - Required fields check
   - Minimum length validation (6 characters)
   - Password confirmation matching

2. **Backend Validation**:
   - Schema validation using Joi
   - Current password verification
   - Business rule validation

## Usage Examples

### Frontend Usage

```typescript
import { AuthAPI } from "../../data/auth.api";

const handlePasswordChange = async () => {
  const response = await AuthAPI.changePassword({
    currentPassword: "oldPassword123",
    newPassword: "newPassword456"
  });

  if (response.success) {
    console.log("Password changed successfully");
  } else {
    console.error("Error:", response.message);
  }
};
```

### Backend Usage (Service Layer)

```javascript
import { changePassword } from "../services/userService.js";

try {
  const success = await changePassword(userId, currentPassword, newPassword);
  if (success) {
    console.log("Password updated in database");
  }
} catch (error) {
  console.error("Password change failed:", error.message);
}
```

## Testing

### Manual Testing

1. Login to the application
2. Navigate to Settings > Profile
3. Scroll to "Password Security" section
4. Fill in current password and new password
5. Confirm new password
6. Click "Change Password"

### API Testing with curl

```bash
# Get auth token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"currentPassword"}'

# Change password
curl -X POST http://localhost:3000/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "currentPassword": "currentPassword",
    "newPassword": "newPassword123"
  }'
```

## File Structure

### Backend Files

```
backend/src/
├── controllers/userController.js       # Password change endpoints
├── services/userService.js            # Password change business logic
├── routes/users.js                     # Route definitions
├── utils/validation.js                 # Input validation schemas
├── utils/auth.js                       # Password hashing utilities
└── middleware/auth.js                  # Authentication middleware
```

### Frontend Files

```
frontend/src/
├── data/auth.api.ts                    # API client methods
├── components/settings/SettingsPage.tsx # UI implementation
└── types/                              # TypeScript interfaces
```

## Security Considerations

1. **Password Storage**: Never store plain text passwords
2. **Transit Security**: HTTPS recommended for production
3. **Token Security**: JWT tokens should be stored securely
4. **Rate Limiting**: Prevent brute force attacks
5. **Audit Logging**: Password changes are logged for security auditing
6. **Input Sanitization**: All inputs are validated and sanitized

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_ISSUER=inventory-app
JWT_AUDIENCE=inventory-users

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## Troubleshooting

### Common Issues

1. **"Current password is incorrect"**
   - Verify the user is entering their actual current password
   - Check if the user account exists and is active

2. **"New password must be at least 6 characters long"**
   - Frontend and backend both enforce minimum password length
   - Update validation if different requirements needed

3. **"User not found"**
   - Check if the user ID is valid
   - Verify the user hasn't been deleted

4. **Token validation errors**
   - Ensure JWT secret is properly configured
   - Check token expiration settings

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed error
logs.
