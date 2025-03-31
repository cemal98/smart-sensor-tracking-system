import { 
    Controller, 
    Post, 
    Body, 
    Get, 
    UseGuards, 
    Request,
    UnauthorizedException, 
    Logger 
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  import { UserActivityService } from '../user-activity/user-activity.service';
  import { ActivityAction } from '../user-activity/entities/user-activity.entity';
  
  @Controller('auth')
  export class AuthController {
    private readonly logger = new Logger(AuthController.name);
  
    constructor(
      private authService: AuthService,
      private userActivityService: UserActivityService,
    ) {}
  
    @Post('login')
    async login(@Body() loginDto: { email: string; password: string }, @Request() req) {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
  
      if (!user) {
        throw new UnauthorizedException('Geçersiz kimlik bilgileri');
      }
  
      await this.userActivityService.createActivity({
        userId: user.id,
        action: ActivityAction.LOGIN,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
  
      return this.authService.login(user);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
      return req.user;
    }
  
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Request() req) {
      await this.userActivityService.createActivity({
        userId: req.user.id,
        action: ActivityAction.LOGOUT,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
  
      return { message: 'Çıkış başarılı' };
    }
  }