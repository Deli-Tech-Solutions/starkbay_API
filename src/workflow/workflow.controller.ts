import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { CreateApprovalDto, UpdateApprovalDto } from './dto/approval.dto';

@ApiTags('workflow')
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('submit/:contentId')
  @ApiOperation({ summary: 'Submit content for approval' })
  @ApiResponse({ status: 200, description: 'Content submitted for approval' })
  async submitForApproval(
    @Param('contentId') contentId: string,
    @Body() body: { submitterId: string },
  ) {
    return this.workflowService.submitForApproval(contentId, body.submitterId);
  }

  @Post('approvals')
  @ApiOperation({ summary: 'Create approval record' })
  @ApiResponse({ status: 201, description: 'Approval created successfully' })
  async createApproval(@Body() createApprovalDto: CreateApprovalDto) {
    return this.workflowService.createApproval(createApprovalDto);
  }

  @Patch('approvals/:id')
  @ApiOperation({ summary: 'Update approval status' })
  @ApiResponse({ status: 200, description: 'Approval updated successfully' })
  async updateApproval(
    @Param('id') id: string,
    @Body() updateApprovalDto: UpdateApprovalDto,
  ) {
    return this.workflowService.updateApproval(id, updateApprovalDto);
  }

  @Get('approvals')
  @ApiOperation({ summary: 'Get approvals with optional filtering' })
  @ApiResponse({ status: 200, description: 'Approvals retrieved successfully' })
  async getApprovals(
    @Query('contentId') contentId?: string,
    @Query('reviewerId') reviewerId?: string,
  ) {
    return this.workflowService.getApprovals(contentId, reviewerId);
  }

  @Get('approvals/pending')
  @ApiOperation({ summary: 'Get pending approvals' })
  @ApiResponse({
    status: 200,
    description: 'Pending approvals retrieved successfully',
  })
  async getPendingApprovals(@Query('reviewerId') reviewerId?: string) {
    return this.workflowService.getPendingApprovals(reviewerId);
  }

  @Get('approvals/history/:contentId')
  @ApiOperation({ summary: 'Get approval history for content' })
  @ApiResponse({
    status: 200,
    description: 'Approval history retrieved successfully',
  })
  async getApprovalHistory(@Param('contentId') contentId: string) {
    return this.workflowService.getApprovalHistory(contentId);
  }
}
