import { 
    Controller, 
    Get, 
    Param, 
    Query, 
    UseGuards, 
    Req,
    ParseUUIDPipe, 
    Logger 
  } from '@nestjs/common';
  import { UserActivityService } from './user-activity.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { UserRole } from '../users/entities/user.entity';
  import { ActivityAction } from './entities/user-activity.entity';
  
  @Controller('user-activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class UserActivityController {
    private readonly logger = new Logger(UserActivityController.name);
    
    constructor(private readonly userActivityService: UserActivityService) {}
  
    @Get()
    @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    async findAll(@Query('action') action?: string, @Query('userId') userId?: string) {
      this.logger.log(`Kullanıcı aktiviteleri sorgulanıyor. Action: ${action}, UserId: ${userId}`);
      
      if (action && userId) {
        return this.userActivityService.findByUser(userId);
      }
      
      if (action) {
        return this.userActivityService.findByAction(action as ActivityAction);
      }
      
      if (userId) {
        return this.userActivityService.findByUser(userId);
      }
      
      return { message: 'Lütfen filtreleme parametreleri belirtin (action, userId)' };
    }
  
    @Get('log-views')
    @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    async findLogViews(@Query('userId') userId: string) {
      this.logger.log(`Log görüntüleme aktiviteleri sorgulanıyor. UserId: ${userId}`);
      
      await this.userActivityService.createActivity({
        userId: userId,
        action: ActivityAction.VIEWED_LOGS,
        details: 'Kullanıcı log görüntüleme aktivitelerini inceledi',
      });
      
      if (userId) {
        return this.userActivityService.findLogViewsByUser(userId);
      }
      
      return this.userActivityService.getLogViewHourlyDistribution();
    }
  
    @Get('stats/distribution')
    @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    async getDistribution(
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      this.logger.log(`Aktivite dağılımı sorgulanıyor. Tarih aralığı: ${startDate} - ${endDate}`);
      
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate) {
        start = new Date(startDate);
      }
      
      if (endDate) {
        end = new Date(endDate);
      }
      
      return this.userActivityService.getActivityDistribution(start, end);
    }
  
    @Get('stats/most-active')
    @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    async getMostActiveUsers(@Query('limit') limit = '10') {
      this.logger.log(`En aktif kullanıcılar sorgulanıyor. Limit: ${limit}`);
      return this.userActivityService.getMostActiveUsers(parseInt(limit, 10));
    }
  
    @Get('user/:id')
    async findUserActivities(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
      if (req.user.id === id || req.user.role === UserRole.SYSTEM_ADMIN || 
          (req.user.role === UserRole.COMPANY_ADMIN && req.user.companyId === req.user.companyId)) {
        
        this.logger.log(`${id} kullanıcısının aktiviteleri sorgulanıyor`);
        return this.userActivityService.findByUser(id);
      }
      
      return { message: 'Bu kullanıcının aktivitelerini görüntüleme yetkiniz yok' };
    }
  }