# User Management System

A comprehensive user management system built with NestJS, TypeORM, and PostgreSQL. This system provides complete user account management, profiles, preferences, and email verification functionality.

## Features

### Core User Management
- ✅ User registration and authentication
- ✅ User profile management
- ✅ User preferences system
- ✅ User status tracking (active, suspended, banned, etc.)
- ✅ Advanced search and filtering
- ✅ Email verification process
- ✅ Password management and security

### User Profiles
- Personal information management
- Avatar and media uploads
- Privacy settings
- Social media links
- Address management
- Public/private profile visibility

### User Preferences
- Notification preferences (email, push, SMS)
- UI/UX preferences (theme, language, timezone)
- Privacy settings
- Shopping preferences
- Content preferences and interests

### Email Verification
- Account email verification
- Email change verification
- Password reset verification
- Resend verification functionality
- Verification history tracking

### Security Features
- Password hashing with bcrypt
- Account lockout after failed attempts
- Two-factor authentication support
- Secure token generation
- IP address and user agent tracking

## API Endpoints

### User Management
\`\`\`
POST   /users                    # Create new user
GET    /users                    # Get all users (admin)
GET    /users/stats              # Get user statistics (admin)
GET    /users/me                 # Get current user
GET    /users/:id                # Get user by ID
PATCH  /users/me                 # Update current user
PATCH  /users/:id                # Update user (admin)
DELETE /users/:id                # Delete user (admin)
\`\`\`

### Password Management
\`\`\`
POST   /users/me/change-password # Change password
\`\`\`

### User Status
\`\`\`
PATCH  /users/:id/status         # Update user status (admin)
\`\`\`

### User Profiles
\`\`\`
POST   /users/me/profile         # Create profile
GET    /users/me/profile         # Get current user profile
PATCH  /users/me/profile         # Update profile
GET    /users/:id/profile/public # Get public profile
GET    /users/profiles/search    # Search profiles
\`\`\`

### User Preferences
\`\`\`
GET    /users/me/preferences                # Get preferences
PATCH  /users/me/preferences                # Update preferences
PATCH  /users/me/preferences/notifications  # Update notifications
PATCH  /users/me/preferences/privacy        # Update privacy
POST   /users/me/preferences/reset          # Reset to defaults
\`\`\`

### Email Verification
\`\`\`
POST   /users/verify-email                  # Verify email
POST   /users/resend-verification           # Resend verification
GET    /users/me/verification-history       # Get verification history
\`\`\`

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (Unique)
- `username` (Unique)
- `password` (Hashed)
- `firstName`, `lastName`
- `status` (Enum: active, inactive, suspended, banned, pending_verification)
- `role` (Enum: user, admin, moderator, super_admin)
- `emailVerified`, `emailVerifiedAt`
- `lastLoginAt`, `lastLoginIp`
- `loginAttempts`, `lockedUntil`
- `twoFactorEnabled`, `twoFactorSecret`
- `metadata` (JSON)
- `createdAt`, `updatedAt`

### User Profiles Table
- `id` (UUID, Primary Key)
- `userId` (Foreign Key)
- `bio`, `avatar`, `dateOfBirth`, `gender`
- `phoneNumber`, `phoneVerified`
- `website`, `company`, `jobTitle`
- `location`, `timezone`, `language`
- `address` (JSON)
- `socialLinks` (JSON)
- `profileVisibility`, `showEmail`, `showPhone`
- `createdAt`, `updatedAt`

### User Preferences Table
- `id` (UUID, Primary Key)
- `userId` (Foreign Key)
- Notification preferences (email, push, SMS, marketing, etc.)
- UI/UX preferences (theme, language, timezone, etc.)
- Privacy preferences (profile visibility, online status, etc.)
- Shopping preferences (default addresses, payment methods, etc.)
- Content preferences (interests, favorite categories/brands, etc.)
- `customPreferences` (JSON)
- `createdAt`, `updatedAt`

### Email Verifications Table
- `id` (UUID, Primary Key)
- `userId` (Foreign Key)
- `email`, `token`
- `type` (Enum: email_verification, email_change, password_reset)
- `status` (Enum: pending, verified, expired, failed)
- `expiresAt`, `verifiedAt`
- `attempts`, `maxAttempts`
- `ipAddress`, `userAgent`
- `metadata` (JSON)
- `createdAt`

### User Status History Table
- `id` (UUID, Primary Key)
- `userId` (Foreign Key)
- `previousStatus`, `newStatus`
- `changedBy`, `reason`
- `ipAddress`, `userAgent`
- `metadata` (JSON)
- `createdAt`

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=starkbay
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   \`\`\`

4. Run database migrations:
   \`\`\`bash
   npm run migration:run
   \`\`\`

5. Start the application:
   \`\`\`bash
   npm run start:dev
   \`\`\`

## Usage Examples

### Creating a User
\`\`\`typescript
const createUserDto = {
  email: 'user@example.com',
  username: 'johndoe',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe'
};

const response = await fetch('/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createUserDto)
});
\`\`\`

### Updating User Preferences
\`\`\`typescript
const preferences = {
  emailNotifications: true,
  theme: 'dark',
  language: 'en',
  timezone: 'America/New_York',
  interests: ['technology', 'sports', 'music']
};

const response = await fetch('/users/me/preferences', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify(preferences)
});
\`\`\`

### Searching Users (Admin)
\`\`\`typescript
const params = new URLSearchParams({
  search: 'john',
  status: 'active',
  page: '1',
  limit: '10',
  sortBy: 'createdAt',
  sortOrder: 'DESC'
});

const response = await fetch(`/users?${params}`, {
  headers: {
    'Authorization': 'Bearer admin_jwt_token'
  }
});
\`\`\`

## Security Considerations

1. **Password Security**: Passwords are hashed using bcrypt with 12 salt rounds
2. **Account Lockout**: Accounts are locked after 5 failed login attempts
3. **Token Security**: Verification tokens are generated using crypto.randomBytes
4. **Input Validation**: All inputs are validated using class-validator
5. **Authorization**: Role-based access control with JWT guards
6. **Rate Limiting**: Consider implementing rate limiting for sensitive endpoints

## Testing

Run the test suite:
\`\`\`bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
