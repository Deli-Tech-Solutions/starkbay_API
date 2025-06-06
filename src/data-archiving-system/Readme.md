# NestJS Data Archiving System

## Overview
This comprehensive archiving system provides automated data lifecycle management for NestJS applications, maintaining database performance while preserving historical records.

## Features
- **Automated Archiving**: Configurable criteria-based archiving
- **Data Integrity**: Transactional operations ensure consistency
- **Flexible Retrieval**: Query archived data with filters
- **Scheduled Jobs**: Automatic daily archiving and weekly purging
- **Multiple Export Formats**: JSON, CSV, and SQL exports
- **Compression Support**: Optional gzip compression for exports
- **Monitoring**: Job tracking and statistics

## Installation & Setup

1. Install dependencies:
```bash
npm install @nestjs/typeorm @nestjs/config @nestjs/schedule typeorm
```

2. Import the ArchiveModule in your app.module.ts:
```typescript
import { ArchiveModule } from './archive/archive.module';

@Module({
  imports: [
    ArchiveModule,
    // ... other modules
  ],
})
export class AppModule {}
```

3. Run database migrations to create archive tables:
```bash
npm run typeorm:migration:run
```

## Configuration

Configure archiving criteria in your environment or config file:

```typescript
// app.module.ts
ConfigModule.forRoot({
  load: [archiveConfig],
})
```

Customize archive criteria in `config/archive.config.ts`:
- `ageThreshold`: Days after which records are archived
- `retentionPeriod`: Days before archived records are purged
- `batchSize`: Number of records processed per batch
- `enabled`: Enable/disable archiving for specific tables

## API Endpoints

### Archive Operations
- `POST /archive/tables/:tableName/archive` - Manual archive trigger
- `GET /archive/tables/:tableName/data` - Retrieve archived data
- `POST /archive/records/:archiveId/restore` - Restore specific record
- `POST /archive/export` - Export archived data
- `GET /archive/statistics` - View archive statistics
- `DELETE /archive/purge` - Manual purge trigger

### Example Usage

Archive a specific table:
```bash
curl -X POST http://localhost:3000/archive/tables/user_activities/archive
```

Retrieve archived data:
```bash
curl "http://localhost:3000/archive/tables/user_activities/data?limit=50"
```

Export archived data:
```bash
curl -X POST http://localhost:3000/archive/export \
  -H "Content-Type: application/json" \
  -d '{"tableName": "user_activities", "format": "csv"}'
```

## Scheduled Jobs

The system automatically runs:
- **Daily Archiving**: Every day at 2 AM
- **Weekly Purging**: Every Sunday at 3 AM

## Database Schema

The system creates two main tables:
- `archive_metadata`: Stores archived record metadata and data
- `archive_jobs`: Tracks archiving job execution

## Best Practices

1. **Testing**: Test archiving on non-production data first
2. **Monitoring**: Regularly check archive job status and statistics
3. **Backup**: Ensure archived data is included in backup strategies
4. **Performance**: Adjust batch sizes based on system capacity
5. **Retention**: Set appropriate retention periods based on compliance requirements

## Error Handling

The system includes comprehensive error handling:
- Transaction rollback on failures
- Job status tracking
- Detailed error logging
- Graceful degradation

## Performance Considerations

- Uses batched processing to minimize memory usage
- Indexed archive metadata for fast retrieval
- Configurable concurrency limits
- Optional compression for storage efficiency

## Compliance & Security

- Maintains complete audit trail
- Supports data retention policies
- Secure export mechanisms
- Role-based access control ready
*/