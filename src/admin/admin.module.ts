import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemConfig } from './entities/system-config.entity';
import { AdminLog } from './entities/admin-log.entity';
import { User } from '../users/entities/user.entity';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemConfig, AdminLog, User]),
    ConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminDashboardService],
  exports: [AdminService],
})
export class AdminModule {} 