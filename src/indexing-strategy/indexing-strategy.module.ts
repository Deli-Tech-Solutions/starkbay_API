import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QueryAnalysisService } from './services/query-analysis.service';
import { IndexManagementService } from './services/index-management.service';
import { IndexMonitoringService } from './services/index-monitoring.service';
import { IndexSuggestionService } from './services/index-suggestion.service';
import { IndexMaintenanceService } from './services/index-maintenance.service';
import { IndexAdminController } from './controllers/index-admin.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    QueryAnalysisService,
    IndexManagementService,
    IndexMonitoringService,
    IndexSuggestionService,
    IndexMaintenanceService,
  ],
  controllers: [],
  exports: [
    QueryAnalysisService,
    IndexManagementService,
    IndexMonitoringService,
    IndexSuggestionService,
    IndexMaintenanceService,
  ],
})
export class IndexingModule {}