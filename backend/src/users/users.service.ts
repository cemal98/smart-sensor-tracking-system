import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ 
      order: { firstName: 'ASC' },
      relations: ['company']
    });
  }

  async findByCompany(companyId: string): Promise<User[]> {
    return this.usersRepository.find({ 
      where: { companyId },
      order: { firstName: 'ASC' },
      relations: ['company']
    });
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['company']
    });
    
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['company']
    });
  }

  async create(createUserDto: any): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`${createUserDto.email} e-posta adresi zaten kayıtlı`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const result = await this.usersRepository.save(newUser);
    const savedUser = (Array.isArray(result) ? result[0] : result) as User;
    
    this.logger.log(`Yeni kullanıcı oluşturuldu: ${savedUser.email}`);
    
    return savedUser;
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    const user = await this.findOne(id);
    
    if (!user) {
      throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException(`${updateUserDto.email} e-posta adresi zaten kayıtlı`);
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateUserDto);
    
    const updatedUser = await this.findOne(id);
    if (!updatedUser) {
      throw new Error(`${id} ID'li kullanıcı güncellendikten sonra bulunamadı`);
    }
    
    this.logger.log(`Kullanıcı güncellendi: ${id}`);
    
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    if (!user) {
      throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
    }

    await this.usersRepository.delete(id);
    this.logger.log(`Kullanıcı silindi: ${id}`);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`${id} ID'li kullanıcı bulunamadı`);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(id, { password: hashedPassword });
    
    this.logger.log(`Kullanıcı şifresi değiştirildi: ${id}`);
    return true;
  }

  async createSystemAdmin(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const existingAdmin = await this.usersRepository.findOne({
      where: { role: UserRole.SYSTEM_ADMIN }
    });
    
    if (existingAdmin) {
      throw new ConflictException('Sistem yöneticisi zaten mevcut');
    }

    return this.create({
      email,
      password,
      firstName,
      lastName,
      role: UserRole.SYSTEM_ADMIN,
    });
  }
}