import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.warn(`Giriş başarısız: ${email} kullanıcısı bulunamadı`);
      return null;
    }

    if (!user.isActive) {
      this.logger.warn(`Giriş başarısız: ${email} kullanıcısı aktif değil`);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Giriş başarısız: ${email} için şifre geçersiz`);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;

    return result;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    this.logger.log(`Kullanıcı giriş yaptı: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getAuthenticatedUser(userId: string) {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw new UnauthorizedException('Kullanıcı bulunamadı');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;

      return result;
    } catch (error) {
      this.logger.error(`Kullanıcı bilgileri alınamadı: ${error.message}`);
      throw new UnauthorizedException('Kullanıcı bilgileri alınamadı');
    }
  }
}
