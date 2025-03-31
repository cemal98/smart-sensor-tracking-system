import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
  ) {}

  async findAll(): Promise<Company[]> {
    const companies = await this.companiesRepository.find({
      order: { name: 'ASC' },
    });
    return companies;
  }

  async findOne(id: string): Promise<Company | null> {
    const company = await this.companiesRepository.findOne({
      where: { id },
      relations: ['users', 'sensors'],
    });
    
    return company;
  }

  async findByCode(code: string): Promise<Company | null> {
    const company = await this.companiesRepository.findOne({
      where: { code },
    });
    return company;
  }

  async create(createCompanyDto: any): Promise<Company> {
    const existingCompany = await this.findByCode(createCompanyDto.code);
    if (existingCompany) {
      throw new ConflictException(`${createCompanyDto.code} kodlu şirket zaten mevcut`);
    }

    const newCompany = this.companiesRepository.create(createCompanyDto);
    
    const result = await this.companiesRepository.save(newCompany);
    const savedCompany = (Array.isArray(result) ? result[0] : result) as Company;
    
    this.logger.log(`Yeni şirket oluşturuldu: ${savedCompany.name} (${savedCompany.code})`);
    return savedCompany;
  }

  async update(id: string, updateCompanyDto: any): Promise<Company> {
    const company = await this.findOne(id);
    
    if (!company) {
      throw new NotFoundException(`${id} ID'li şirket bulunamadı`);
    }

    if (updateCompanyDto.code && updateCompanyDto.code !== company.code) {
      const existingCompany = await this.findByCode(updateCompanyDto.code);
      if (existingCompany) {
        throw new ConflictException(`${updateCompanyDto.code} kodlu şirket zaten mevcut`);
      }
    }

    await this.companiesRepository.update(id, updateCompanyDto);
    
    const updatedCompanyResult = await this.findOne(id);
    if (!updatedCompanyResult) {
      throw new Error(`${id} ID'li şirket güncellendikten sonra bulunamadı`);
    }
    
    this.logger.log(`Şirket güncellendi: ${id}`);
    return updatedCompanyResult;
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    
    if (!company) {
      throw new NotFoundException(`${id} ID'li şirket bulunamadı`);
    }

    if (company.users?.length > 0) {
      throw new ConflictException(`Şirket silinemez: ${company.users.length} aktif kullanıcı mevcut`);
    }

    if (company.sensors?.length > 0) {
      throw new ConflictException(`Şirket silinemez: ${company.sensors.length} aktif sensör mevcut`);
    }

    await this.companiesRepository.delete(id);
    this.logger.log(`Şirket silindi: ${id}`);
  }

  async deactivate(id: string): Promise<Company> {
    const company = await this.findOne(id);
    
    if (!company) {
      throw new NotFoundException(`${id} ID'li şirket bulunamadı`);
    }

    await this.companiesRepository.update(id, { isActive: false });
    
    const updatedCompanyResult = await this.findOne(id);
    if (!updatedCompanyResult) {
      throw new Error(`${id} ID'li şirket devre dışı bırakıldıktan sonra bulunamadı`);
    }
    
    this.logger.log(`Şirket devre dışı bırakıldı: ${id}`);
    return updatedCompanyResult;
  }

  async activate(id: string): Promise<Company> {
    const company = await this.findOne(id);
    
    if (!company) {
      throw new NotFoundException(`${id} ID'li şirket bulunamadı`);
    }

    await this.companiesRepository.update(id, { isActive: true });
    
    const updatedCompanyResult = await this.findOne(id);
    if (!updatedCompanyResult) {
      throw new Error(`${id} ID'li şirket aktifleştirildikten sonra bulunamadı`);
    }
    
    this.logger.log(`Şirket aktifleştirildi: ${id}`);
    return updatedCompanyResult;
  }
}