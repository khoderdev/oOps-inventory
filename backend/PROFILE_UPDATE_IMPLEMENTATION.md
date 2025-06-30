# Profile Update Implementation

## Overview

Comprehensive user profile update functionality has been implemented for the
inventory management system. This includes both backend API endpoints and
frontend integration, allowing users to update their basic profile information
(firstName, lastName, email) while maintaining proper security controls for role
management.

## Backend Implementation

### API Endpoints

#### 1. Update Current User's Profile

```
PUT /api/users/profile
```

- **Authentication**: Required (Bearer token)
- **Access**: Own profile only
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
  ```

#### 2. Update Any User's Profile (Admin)

```
PUT /api/users/:id
```

- **Authentication**: Required (Bearer token)
- **Access**: Admin/Manager or own profile
- **Parameters**: `id` - User ID
- **Body**: Same as above, plus optional role field for admins

### Validation Rules

#### Profile Requirements

- **First Name**: 1-100 characters, required
- **Last Name**: 1-100 characters, required
- **Email**: Valid email format, must be unique
- **Role**: Only updateable by admins through separate endpoints

#### Request Validation

- Uses Joi schema validation
- Validates firstName, lastName, and email fields
- Returns detailed error messages for validation failures
- At least one field must be provided for update

### Security Features

1. **Role Protection**: Regular users cannot change their own role
2. **Email Uniqueness**: Prevents duplicate email addresses
3. **Input Sanitization**: All inputs are trimmed and validated
4. **JWT Authentication**: Secure token-based authentication required
5. **Field Filtering**: Role field is filtered out for regular users
6. **Account Status Check**: Only active users can update profiles

### Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Validation errors, email already in use
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server-side errors

### Example Responses

#### Success Response

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STAFF",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Email address is already in use"
}
```

## Frontend Integration

### API Client

- Added `updateProfile` method to `AuthAPI` class
- Located in `frontend/src/data/auth.api.ts`
- Handles API communication and error responses

### UI Components

- Integrated into Settings page (`SettingsPage.tsx`)
- Features:
  - Separate input fields for firstName, lastName, email
  - Role display (read-only for non-admins)
  - Client-side validation
  - Loading states during API calls
  - Success/error feedback
  - Real-time form validation

### Validation Flow

1. **Frontend Validation**:
   - Required fields check
   - Email format validation
   - Field length validation
   - Trim whitespace from inputs

2. **Backend Validation**:
   - Schema validation using Joi
   - Email uniqueness check
   - Business rule validation

## Usage Examples

### Frontend Usage

```typescript
import { AuthAPI } from "../../data/auth.api";

const handleProfileUpdate = async () => {
  const response = await AuthAPI.updateProfile({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com"
  });

  if (response.success) {
    console.log("Profile updated successfully");
    // Update global state with new user data
    setUser(response.user);
  } else {
    console.error("Error:", response.message);
  }
};
```

### Backend Usage (Service Layer)

```javascript
import { updateUser } from "../services/userService.js";

try {
  const updatedUser = await updateUser(userId, {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com"
  });
  console.log("Profile updated in database");
} catch (error) {
  console.error("Profile update failed:", error.message);
}
```

## Testing

### Manual Testing

1. Login to the application
2. Navigate to Settings > Profile
3. Update firstName, lastName, or email in "Basic Information" section
4. Click "Save Profile Changes"
5. Verify success message and UI updates

### API Testing with curl

```bash
# Get auth token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Update profile
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }'
```

## File Structure

### Backend Files

```
backend/src/
├── controllers/userController.js       # Profile update endpoints
├── services/userService.js            # Profile update business logic
├── routes/users.js                     # Route definitions
├── utils/validation.js                 # Input validation schemas
├── models/User.js                      # Database operations
└── middleware/auth.js                  # Authentication middleware
```

### Frontend Files

```
frontend/src/
├── data/auth.api.ts                    # API client methods
├── components/settings/SettingsPage.tsx # UI implementation
└── types/                              # TypeScript interfaces
```

## Role Management

### Current User Role Display

- Users can see their current role but cannot change it
- Role field is displayed as read-only with appropriate styling
- Helpful text indicates that role changes require admin assistance

### Admin Role Management

- Admins can change user roles through the existing `/api/users/:id/role`
  endpoint
- Admins cannot change their own role (security measure)
- Role changes are logged and tracked separately

## Security Considerations

1. **Data Integrity**: Email uniqueness enforced at database level
2. **Input Validation**: All inputs validated and sanitized
3. **Authorization**: Users can only update their own profiles
4. **Role Protection**: Role changes require admin privileges
5. **Audit Logging**: Profile changes are logged for security auditing
6. **Rate Limiting**: Applied at application level to prevent abuse

## Troubleshooting

### Common Issues

1. **"Email address is already in use"**
   - User is trying to change email to one that already exists
   - Check if the email is already registered in the system

2. **"First name cannot be empty"**
   - Frontend validation should catch this, but backend validates too
   - Ensure required fields are properly filled

3. **"User not found"**
   - Check if the user ID is valid and user hasn't been deleted
   - Verify authentication token is valid

4. **Profile doesn't update in UI**
   - Check if the API call was successful
   - Verify that `setUser()` is called with the response data

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed operation
logs.

## Future Enhancements

### Planned Features

1. **Profile Picture Upload**: Add avatar/profile picture functionality
2. **Email Verification**: Require verification for email changes
3. **Audit Trail**: Detailed history of profile changes
4. **Bulk Updates**: Admin ability to update multiple users
5. **Advanced Validation**: Custom validation rules per organization

### API Versioning

Consider API versioning for future breaking changes:

- `/api/v1/users/profile` - Current implementation
- `/api/v2/users/profile` - Future enhanced version

## Performance Considerations

1. **Database Indexing**: Email field should be indexed for uniqueness checks
2. **Caching**: Consider caching user profile data for better performance
3. **Validation**: Frontend validation reduces server load
4. **Rate Limiting**: Prevents abuse and ensures system stability

## Monitoring and Analytics

### Metrics to Track

- Profile update frequency
- Failed update attempts
- Email change patterns
- User engagement with profile settings

### Logging

All profile updates are logged with:

- User ID and email
- Fields changed
- Timestamp
- IP address (from request headers)
- Success/failure status
