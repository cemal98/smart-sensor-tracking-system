import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
  Request,
  BadRequestException
} from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { Sensor } from './entities/sensor.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('sensors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SensorsController {
  private readonly logger = new Logger(SensorsController.name);

  constructor(
    private readonly sensorsService: SensorsService
  ) { }

  @Get()
  async findAll(
    @Query('companyId') companyId: string,
    @Request() req
  ): Promise<Sensor[]> {
    if (req.user.role === UserRole.SYSTEM_ADMIN) {
      return this.sensorsService.findAllByCompany(companyId || '');
    }

    return this.sensorsService.findAllByCompany(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const sensor = await this.sensorsService.findOne(id);

    if (!sensor) {
      throw new NotFoundException(`Sensör bulunamadı: ${id}`);
    }

    if (req.user.role === UserRole.SYSTEM_ADMIN) {
      return sensor;
    }

    if (sensor.companyId === req.user.companyId) {
      return sensor;
    }

    throw new NotFoundException(`Sensör bulunamadı: ${id}`);
  }

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async create(@Body() createSensorDto: any, @Request() req) {
    if (req.user.role === UserRole.COMPANY_ADMIN) {
      createSensorDto.companyId = req.user.companyId;
    }

    if (req.user.role === UserRole.SYSTEM_ADMIN && !createSensorDto.companyId) {
      throw new BadRequestException('System Admin sensör eklerken companyId belirtmelidir');
    }

    return this.sensorsService.create(createSensorDto);
  }

  @Put(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateSensorDto: any,
    @Request() req
  ) {
    const sensor = await this.sensorsService.findOne(id);

    if (!sensor) {
      throw new NotFoundException(`Sensör bulunamadı: ${id}`);
    }

    if (req.user.role === UserRole.COMPANY_ADMIN && sensor.companyId !== req.user.companyId) {
      throw new NotFoundException(`Sensör bulunamadı: ${id}`);
    }

    if (req.user.role === UserRole.COMPANY_ADMIN) {
      delete updateSensorDto.companyId;
    }

    return this.sensorsService.update(id, updateSensorDto);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async remove(@Param('id') id: string, @Request() req) {
    const sensor = await this.sensorsService.findOne(id);

    if (!sensor) {
      throw new NotFoundException(`Sensör bulunamadı: ${id}`);
    }

    if (req.user.role === UserRole.COMPANY_ADMIN && sensor.companyId !== req.user.companyId) {
      throw new NotFoundException(`Sensör bulunamadı: ${id}`);
    }

    await this.sensorsService.remove(id);
    return { message: 'Sensör başarıyla silindi' };
  }

  @Get('public/list')
  @Public()
  async getPublicSensors() {
    return this.sensorsService.getPublicSensors();
  }

  @Get('data/:sensorId')
  async getSensorData(
    @Param('sensorId') sensorId: string,
    @Query('from') from: string,
    @Request() req,
    @Query('to') to?: string,
    @Query('fields') fields?: string,
  ) {
    this.logger.log(`Sensör verileri istendi: ${sensorId}, range: ${from} - ${to || 'now'}`);

    const sensor = await this.sensorsService.findBySensorId(sensorId);

    if (!sensor) {
      throw new NotFoundException(`Sensör bulunamadı: ${sensorId}`);
    }

    if (req.user.role === UserRole.SYSTEM_ADMIN || sensor.companyId === req.user.companyId) {
      return this.sensorsService.getSensorHistoricalData(sensor.id, from, to, fields);
    }

    throw new NotFoundException(`Sensör bulunamadı: ${sensorId}`);
  }
}