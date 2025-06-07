# Database Setup Documentation

## Overview

This document describes the PostgreSQL database configuration with TypeORM for the StarkBay API. The setup includes connection pooling, migration system, entity validation, and environment-specific configurations.

## Environment Variables

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_DATABASE=starkbay

# Environment
NODE_ENV=development

# Optional Database Settings
DB_LOGGING=true
```

### Production Environment Variables

For production environments, add the following additional variables:

```bash
# Production Database
NODE_ENV=production
DB_HOST=your-production-host
DB_USERNAME=your-production-username
DB_PASSWORD=your-secure-production-password
DB_DATABASE=starkbay_prod

# SSL Configuration (if required)
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA=path/to/ca-certificate.crt
DB_SSL_CERT=path/to/client-cert.crt
DB_SSL_KEY=path/to/client-key.key

# Connection Pool Settings (optional)
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE=10000
DB_POOL_ACQUIRE=30000
DB_CONNECTION_LIMIT=20
DB_STATEMENT_TIMEOUT=30000
DB_QUERY_TIMEOUT=30000
```

## Database Connection Configuration

### Connection Pooling

The database connection is configured with connection pooling for optimal performance:

- **Development**: Max 10 connections, Min 2 connections
- **Production**: Max 20 connections, Min 5 connections
- **Idle timeout**: 10 seconds
- **Acquire timeout**: 30 seconds

### SSL Configuration

SSL is automatically enabled for production environments. Configure SSL certificates using the environment variables listed above.

## TypeORM Migration System

### Migration Commands

The following npm scripts are available for managing database migrations:

```bash
# Generate a new migration based on entity changes
npm run migration:generate -- src/migrations/YourMigrationName

# Create a new empty migration file
npm run migration:create -- src/migrations/YourMigrationName

# Run pending migrations
npm run migration:run

# Revert the last executed migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Migration Workflow

1. **Creating Migrations**: 
   ```bash
   npm run migration:create -- src/migrations/AddUserTable
   ```

2. **Generating Migrations from Entity Changes**:
   ```bash
   npm run migration:generate -- src/migrations/UpdateUserEntity
   ```

3. **Running Migrations**:
   ```bash
   npm run migration:run
   ```

4. **Reverting Migrations** (if needed):
   ```bash
   npm run migration:revert
   ```

### Migration Best Practices

- Always review generated migrations before running them
- Test migrations on a development database first
- Use descriptive names for migration files
- Include both `up` and `down` methods for reversibility
- Never modify existing migration files after they've been run

## Entity Validation

### Class Validator Integration

Entities use `class-validator` decorators for data validation. Example from the Coupon entity:

```typescript
import { IsString, IsEnum, IsNumber, Min, Max, Length } from 'class-validator';

@Entity('coupons')
export class Coupon {
  @Column({ unique: true })
  @IsString()
  @Length(3, 50, { message: 'Coupon code must be between 3 and 50 characters' })
  code: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Discount value must be greater than or equal to 0' })
  @Max(100, { message: 'Percentage discount cannot exceed 100%' })
  discountValue: number;
}
```

### Validation Features

- **Type validation**: Ensures correct data types
- **Range validation**: Min/Max values for numbers
- **String length validation**: Minimum and maximum character limits
- **Enum validation**: Restricts values to predefined options
- **Custom error messages**: Provides clear feedback for validation failures

## Database Schema

### Current Entities

1. **Coupon**: Discount coupons with validation rules
2. **CouponUsage**: Tracks coupon usage history  
3. **Subscription**: User subscription management

### Entity Registration

Entities are manually registered in `app.module.ts`:

```typescript
TypeOrmModule.forRoot({
  // ... other config
  entities: [Coupon, CouponUsage, Subscription],
})
```

## Environment-Specific Configurations

### Development Environment

- **Synchronization**: Enabled (auto-creates tables)
- **Logging**: Enabled for debugging
- **Connection Pool**: Smaller pool size (10 max connections)
- **SSL**: Disabled

### Production Environment

- **Synchronization**: Disabled (use migrations only)
- **Logging**: Disabled for performance
- **Connection Pool**: Larger pool size (20 max connections)
- **SSL**: Enabled with certificate validation
- **Migrations**: Auto-run on application start

## Troubleshooting

### Common Issues

1. **Connection Refused**: 
   - Check if PostgreSQL is running
   - Verify host and port configuration
   - Check firewall settings

2. **Authentication Failed**:
   - Verify username and password
   - Check PostgreSQL user permissions
   - Ensure database exists

3. **Migration Errors**:
   - Check database permissions for schema changes
   - Verify migration syntax
   - Review entity definitions for conflicts

4. **SSL Connection Issues**:
   - Verify SSL certificate paths
   - Check certificate validity
   - Ensure SSL is enabled on PostgreSQL server

### Health Checks

The application includes database health checks via the Terminus module. Monitor the `/health` endpoint to verify database connectivity.

## Performance Considerations

- Use connection pooling to manage database connections efficiently
- Enable query logging only in development environments
- Use migrations instead of synchronization in production
- Monitor connection pool usage and adjust settings as needed
- Implement proper indexing strategies for frequently queried columns

## Security Best Practices

- Use environment variables for sensitive configuration
- Enable SSL/TLS for production database connections
- Implement proper database user permissions
- Regularly update database and driver versions
- Use connection timeouts to prevent hanging connections
- Monitor for SQL injection vulnerabilities in custom queries 