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
    Logger 
  } from '@nestjs/common';
  import { SensorsService } from './sensors.service';
  import { Sensor } from './entities/sensor.entity';
  
  @Controller('sensors')
  export class SensorsController {
    private readonly logger = new Logger(SensorsController.name);
  
    constructor(private readonly sensorsService: SensorsService) {}
  
    @Get()
    // @UseGuards(JwtAuthGuard)
    async findAll(@Query('companyId') companyId: string): Promise<Sensor[]> {
      if (companyId) {
        return this.sensorsService.findAllByCompany(companyId);
      }
      
      // return [];
      
      return this.sensorsService.findAllByCompany('');
    }
  
    @Get(':id')
    // @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string) {
      return this.sensorsService.findOne(id);
    }
  
    @Post()
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    create(@Body() createSensorDto: any) {
      return this.sensorsService.create(createSensorDto);
    }
  
    @Put(':id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    update(@Param('id') id: string, @Body() updateSensorDto: any) {
      return this.sensorsService.update(id, updateSensorDto);
    }
  
    @Delete(':id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
    remove(@Param('id') id: string) {
      return this.sensorsService.remove(id);
    }
  
    @Get('data/:sensorId')
    // @UseGuards(JwtAuthGuard)
    async getSensorData(
      @Param('sensorId') sensorId: string,
      @Query('from') from: string,
      @Query('to') to?: string,
      @Query('fields') fields?: string,
    ) {
      if (from === 'latest' || !from) {
        return this.sensorsService.getLatestSensorData(sensorId);
      }
      
      return { message: 'Bu özellik henüz hazır değil' };
    }
  }