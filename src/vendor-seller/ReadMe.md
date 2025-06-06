*
VENDOR MANAGEMENT SYSTEM DOCUMENTATION

## Overview
This comprehensive vendor management system provides complete functionality for multi-vendor marketplace operations.

## Features Implemented

### 1. Vendor Entity & Registration
- Complete vendor profile with business information
- Support for individual, company, and partnership business types
- Address and bank details management
- Social media links integration
- Document upload support for verification

### 2. Vendor Verification Process
- Multi-stage verification with status tracking
- Document verification support
- Admin approval workflow
- Rejection reasons tracking
- Automated status management

### 3. Vendor-Product Relationship
- Products linked to specific vendors
- Vendor-specific product management
- Inventory tracking per vendor
- Product status management

### 4. Commission Structure
- Flexible commission types (percentage/fixed)
- Minimum and maximum commission limits
- Per-vendor commission configuration
- Automatic commission calculation

### 5. Performance Tracking
- Comprehensive metrics tracking:
  - Total orders and revenue
  - Commission earned
  - Customer ratings and reviews
  - Order fulfillment rates
  - Cancellation and return rates
  - On-time delivery tracking

### 6. Status Management
- Multiple vendor statuses: pending, verified, active, inactive, suspended, rejected
- Status transition controls
- Business logic validation

## API Endpoints

### Vendor Management
- POST /vendors - Register new vendor
- GET /vendors - List all vendors (with optional status filter)
- GET /vendors/:id - Get vendor details
- PATCH /vendors/:id - Update vendor profile
- PATCH /vendors/:id/verify - Verify vendor (admin)
- PATCH /vendors/:id/status - Update vendor status
- PATCH /vendors/:id/commission - Update commission structure
- GET /vendors/:id/performance - Get performance report
- POST /vendors/:id/calculate-commission - Calculate commission for order
- DELETE /vendors/:id - Remove vendor

### Product Management
- POST /vendors/:vendorId/products - Create product for vendor
- GET /vendors/:vendorId/products - Get vendor's products
- GET /vendors/:vendorId/products/:id - Get specific product
- PATCH /vendors/:vendorId/products/:id - Update product
- DELETE /vendors/:vendorId/products/:id - Delete product

## Database Schema

### Vendors Table
- Comprehensive business information
- Verification status and documents
- Contact and banking details
- Social media integration

### Products Table
- Product details with vendor relationship
- Inventory management
- Status tracking
- Image gallery support

### Vendor Commissions Table
- Flexible commission structure
- Rate and limit configuration
- Active/inactive status

### Vendor Performance Table
- Real-time metrics tracking
- Calculated performance rates
- Historical data preservation

## Usage Examples

### Register New Vendor
```typescript
const newVendor = await vendorService.create({
  email: 'vendor@example.com',
  businessName: 'Example Store',
  contactPerson: 'John Doe',
  phoneNumber: '+1234567890',
  businessType: BusinessType.COMPANY,
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'State',
    zipCode: '12345',
    country: 'Country'
  }
});
```

### Verify Vendor
```typescript
await vendorService.verify(vendorId, {
  status: VendorStatus.VERIFIED
}, adminUserId);
```

### Calculate Commission
```typescript
const commission = await vendorService.calculateCommission(vendorId, 100.00);
// Returns calculated commission amount based on vendor's commission structure
```

### Update Performance Metrics
```typescript
await vendorService.updatePerformanceMetrics(vendorId, {
  totalOrders: 150,
  totalRevenue: 15000,
  averageRating: 4.5,
  totalReviews: 120
});
```

## Security Considerations
- Input validation with class-validator
- UUID-based primary keys
- Proper error handling
- Business logic validation
- Status transition controls

## Extensibility
The system is designed to be easily extended with:
- Payment integration
- Advanced reporting
- Notification