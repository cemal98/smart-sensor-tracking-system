import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  Logger,
  Post,
  Body
} from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ActivityAction } from './entities/user-activity.entity';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
import { UsersService } from '../users/users.service';

@Controller('user-activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserActivityController {
  private readonly logger = new Logger(UserActivityController.name);

  constructor(private readonly userActivityService: UserActivityService, private readonly usersService: UsersService,) { }

  @Post()
  async createActivity(@Body() body: CreateUserActivityDto, @Req() req) {
    const { userId, action, details } = body;

    this.logger.log(`Yeni kullanıcı aktivitesi oluşturuluyor. UserId: ${userId}, Action: ${action}`);

    return this.userActivityService.createActivity({
      userId,
      action,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async findAll(
    @Req() req,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    const requester = req.user;
    this.logger.log(`Kullanıcı aktiviteleri sorgulanıyor. Action: ${action}, UserId: ${userId}`);

    if (requester.role === UserRole.SYSTEM_ADMIN) {
      if (action && userId) {
        return this.userActivityService.findByUserAndAction(userId, action as ActivityAction);
      }

      if (action) {
        return this.userActivityService.findByAction(action as ActivityAction);
      }

      if (userId) {
        return this.userActivityService.findByUser(userId);
      }

      return this.userActivityService.findAll();
    }

    if (requester.role === UserRole.COMPANY_ADMIN) {
      if (userId) {
        const targetUser = await this.usersService.findOne(userId);
        if (!targetUser || targetUser.companyId !== requester.companyId) {
          return { message: 'Bu kullanıcının aktivitelerini görüntüleme yetkiniz yok' };
        }

        if (action) {
          return this.userActivityService.findByUserAndAction(userId, action as ActivityAction);
        }

        return this.userActivityService.findByUser(userId);
      }

      const companyUsers = await this.usersService.findByCompany(requester.companyId);
      const userIds = companyUsers.map(u => u.id);

      return this.userActivityService.findManyByUserIds(userIds, action as ActivityAction | undefined);
    }

    return { message: 'Yetkisiz erişim' };
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
    const requester = req.user;

    if (requester.role === UserRole.SYSTEM_ADMIN) {
      this.logger.log(`${id} kullanıcısının aktiviteleri SYSTEM_ADMIN tarafından sorgulanıyor`);
      return this.userActivityService.findByUser(id);
    }

    if (requester.id === id) {
      this.logger.log(`Kullanıcı kendi aktivitelerini sorguluyor: ${id}`);
      return this.userActivityService.findByUser(id);
    }

    const targetUser = await this.usersService.findOne(id);
    if (
      requester.role === UserRole.COMPANY_ADMIN &&
      targetUser?.companyId === requester.companyId
    ) {
      this.logger.log(`Company Admin ${requester.id}, şirketine ait kullanıcı ${id}'nin aktivitelerini sorguluyor`);
      return this.userActivityService.findByUser(id);
    }

    this.logger.warn(`Yetkisiz erişim girişimi! Kullanıcı: ${requester.id}, hedef: ${id}`);
    return { message: 'Bu kullanıcının aktivitelerini görüntüleme yetkiniz yok' };
  }

}