import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UserActivity, ActivityAction } from './entities/user-activity.entity';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';

@Injectable()
export class UserActivityService {
  private readonly logger = new Logger(UserActivityService.name);

  constructor(
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
  ) { }

  async createActivity(createActivityDto: CreateUserActivityDto): Promise<UserActivity> {
    const activity = this.userActivityRepository.create({
      ...createActivityDto,
      timestamp: new Date(),
    });

    const savedActivity = await this.userActivityRepository.save(activity);

    this.logger.debug(
      `Kullanıcı aktivitesi kaydedildi: ${createActivityDto.userId} - ${createActivityDto.action}`,
    );

    return savedActivity;
  }

  async findByUser(userId: string): Promise<UserActivity[]> {
    return this.userActivityRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  async findByAction(action: ActivityAction): Promise<UserActivity[]> {
    return this.userActivityRepository.find({
      where: { action },
      order: { timestamp: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<UserActivity[]> {
    return this.userActivityRepository.find({
      where: {
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
    });
  }

  async findLogViewsByUser(userId: string): Promise<UserActivity[]> {
    return this.userActivityRepository.find({
      where: {
        userId,
        action: ActivityAction.VIEWED_LOGS,
      },
      order: { timestamp: 'DESC' },
    });
  }

  async getActivityDistribution(startDate?: Date, endDate?: Date): Promise<Record<string, number>> {
    const query = this.userActivityRepository.createQueryBuilder('activity');

    if (startDate && endDate) {
      query.where('activity.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const activities = await query
      .select('activity.action', 'action')
      .addSelect('COUNT(activity.id)', 'count')
      .groupBy('activity.action')
      .getRawMany();

    const distribution: Record<string, number> = {};

    activities.forEach(activity => {
      distribution[activity.action] = parseInt(activity.count, 10);
    });

    return distribution;
  }

  async getMostActiveUsers(limit = 10): Promise<any[]> {
    return this.userActivityRepository
      .createQueryBuilder('activity')
      .select('activity.userId', 'userId')
      .addSelect('COUNT(activity.id)', 'activityCount')
      .groupBy('activity.userId')
      .orderBy('activityCount', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getLogViewHourlyDistribution(): Promise<Record<number, number>> {
    const activities = await this.userActivityRepository
      .createQueryBuilder('activity')
      .select('EXTRACT(HOUR FROM activity.timestamp)', 'hour')
      .addSelect('COUNT(activity.id)', 'count')
      .where('activity.action = :action', { action: ActivityAction.VIEWED_LOGS })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    const distribution: Record<number, number> = {};

    for (let hour = 0; hour < 24; hour++) {
      distribution[hour] = 0;
    }

    activities.forEach(activity => {
      const hour = parseInt(activity.hour, 10);
      distribution[hour] = parseInt(activity.count, 10);
    });

    return distribution;
  }

  async findAll(): Promise<UserActivity[]> {
    return this.userActivityRepository.find({
      order: { timestamp: 'DESC' },
    });
  }

  async findByUserAndAction(userId: string, action: ActivityAction): Promise<UserActivity[]> {
    return this.userActivityRepository.find({
      where: { userId, action },
      order: { timestamp: 'DESC' },
    });
  }

  async findManyByUserIds(userIds: string[], action?: ActivityAction) {
    const query = this.userActivityRepository.createQueryBuilder('activity')
      .where('activity.userId IN (:...userIds)', { userIds });

    if (action) {
      query.andWhere('activity.action = :action', { action });
    }

    return query.orderBy('activity.timestamp', 'DESC').getMany();
  }
}