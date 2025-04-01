import { ActivityAction } from '../entities/user-activity.entity';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserActivityDto {
    @IsUUID()
    userId: string;

    @IsEnum(ActivityAction)
    action: ActivityAction;

    @IsOptional()
    @IsString()
    ipAddress?: string;

    @IsOptional()
    @IsString()
    details?: string;

    @IsOptional()
    @IsString()
    userAgent?: string;
}
