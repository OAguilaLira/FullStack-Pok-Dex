import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { LoginResponseDto } from './dto/loginResponse.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<User> {
    const existing: User | null = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User with that email already exists');
    }

    const hash: string = await bcrypt.hash(dto.password, 10);
    const user: User = await this.usersService.create(dto.email, hash);

    return user
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user: User | null = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid: boolean = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken:string = this.jwtService.sign(payload);

    return { access_token: accessToken };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user: User | null = await this.usersService.findById(payload.sub);
    if (!user) return null;
    return user;
  }
}

