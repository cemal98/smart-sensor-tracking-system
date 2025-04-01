import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  NotFoundException,
  BadRequestException,
  Logger,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async create(@Body() createUserDto: any, @Request() req) {
    this.logger.log(`Kullanıcı oluşturma isteği alındı: ${createUserDto.email}`);

    if (req.user.role === UserRole.COMPANY_ADMIN) {
      if (!req.user.companyId) {
        throw new BadRequestException('Şirket bilgisi eksik');
      }

      createUserDto.companyId = req.user.companyId;
      createUserDto.role = UserRole.USER;
    }

    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async findAll(@Query('companyId') companyId: string, @Request() req) {
    this.logger.log(`Kullanıcılar listeleniyor. Şirket: ${companyId || 'tümü'}`);

    if (req.user.role === UserRole.COMPANY_ADMIN) {
      return this.usersService.findByCompany(req.user.companyId);
    }

    if (companyId) {
      return this.usersService.findByCompany(companyId);
    }

    return this.usersService.findAll().then(users =>
      users.filter(user => user.role !== UserRole.SYSTEM_ADMIN)
    );
  }

  @Get(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async findOne(@Param('id') id: string, @Request() req) {
    this.logger.log(`Kullanıcı detayı istendi. ID: ${id}`);

    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
    }

    if (req.user.role === UserRole.COMPANY_ADMIN && user.companyId !== req.user.companyId) {
      throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
    }

    return user;
  }

  @Patch(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: any, @Request() req) {
    this.logger.log(`Kullanıcı güncelleme isteği alındı. ID: ${id}`);

    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
    }

    if (req.user.role === UserRole.COMPANY_ADMIN) {
      if (user.companyId !== req.user.companyId) {
        throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
      }

      delete updateUserDto.companyId;
      delete updateUserDto.role;
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async remove(@Param('id') id: string, @Request() req) {
    this.logger.log(`Kullanıcı silme isteği alındı. ID: ${id}`);

    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
    }

    if (req.user.role === UserRole.COMPANY_ADMIN) {
      if (user.companyId !== req.user.companyId) {
        throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
      }

      if (user.role === UserRole.SYSTEM_ADMIN) {
        throw new BadRequestException('Sistem yöneticisini silme yetkiniz yok');
      }
    }

    if (req.user.id === id) {
      throw new BadRequestException('Kendinizi silemezsiniz');
    }

    await this.usersService.remove(id);
    return { message: 'Kullanıcı başarıyla silindi' };
  }

  @Post(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() passwordData: { currentPassword: string; newPassword: string },
    @Request() req,
  ) {
    this.logger.log(`Şifre değiştirme isteği alındı. ID: ${id}`);

    if (req.user.id !== id && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new BadRequestException('Sadece kendi şifrenizi değiştirebilirsiniz');
    }

    const success = await this.usersService.changePassword(
      id,
      passwordData.currentPassword,
      passwordData.newPassword,
    );

    if (!success) {
      throw new BadRequestException('Mevcut şifre yanlış');
    }

    return { message: 'Şifre başarıyla değiştirildi' };
  }
}