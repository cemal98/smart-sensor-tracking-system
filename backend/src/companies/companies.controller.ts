import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    NotFoundException,
    Logger,
    ConflictException,
  } from '@nestjs/common';
  import { CompaniesService } from './companies.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { UserRole } from '../users/entities/user.entity';
  
  @Controller('companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class CompaniesController {
    private readonly logger = new Logger(CompaniesController.name);
  
    constructor(private readonly companiesService: CompaniesService) {}
  
    @Post()
    @Roles(UserRole.SYSTEM_ADMIN)
    async create(@Body() createCompanyDto: any) {
      this.logger.log(`Şirket oluşturma isteği alındı: ${createCompanyDto.name}`);
      return this.companiesService.create(createCompanyDto);
    }
  
    @Get()
    @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    async findAll() {
      this.logger.log('Şirketler listeleniyor');
      return this.companiesService.findAll();
    }
  
    @Get(':id')
    @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    async findOne(@Param('id') id: string) {
      this.logger.log(`Şirket detayı istendi. ID: ${id}`);
      
      const company = await this.companiesService.findOne(id);
      
      if (!company) {
        throw new NotFoundException(`${id} ID'li şirket bulunamadı`);
      }
      
      return company;
    }
  
    @Patch(':id')
    @Roles(UserRole.SYSTEM_ADMIN)
    async update(@Param('id') id: string, @Body() updateCompanyDto: any) {
      this.logger.log(`Şirket güncelleme isteği alındı. ID: ${id}`);
      return this.companiesService.update(id, updateCompanyDto);
    }
  
    @Delete(':id')
    @Roles(UserRole.SYSTEM_ADMIN)
    async remove(@Param('id') id: string) {
      this.logger.log(`Şirket silme isteği alındı. ID: ${id}`);
      
      try {
        await this.companiesService.remove(id);
        return { message: 'Şirket başarıyla silindi' };
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }
        throw new NotFoundException(`${id} ID'li şirket bulunamadı`);
      }
    }
  
    @Patch(':id/deactivate')
    @Roles(UserRole.SYSTEM_ADMIN)
    async deactivate(@Param('id') id: string) {
      this.logger.log(`Şirket devre dışı bırakma isteği alındı. ID: ${id}`);
      return this.companiesService.deactivate(id);
    }
  
    @Patch(':id/activate')
    @Roles(UserRole.SYSTEM_ADMIN)
    async activate(@Param('id') id: string) {
      this.logger.log(`Şirket aktifleştirme isteği alındı. ID: ${id}`);
      return this.companiesService.activate(id);
    }
  }