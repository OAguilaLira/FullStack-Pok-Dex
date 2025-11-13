import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/loginResponse.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  jest.mock('./guards/jwt-auth.guard');

  let controller: AuthController;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    profile: jest.fn()
  }

  const mockSignupDto: SignupDto = {
    email: 'misty@cerulean.com',
    password: 'starmie123'
  };

  const mockLoginDto: LoginDto = {
    email: 'misty@cerulean.com',
    password: 'starmie123'
  };

  const mockUser: User = {
    id: 'user-id-123',
    email: mockSignupDto.email,
    password: 'hashed_password',
    favorites: [],
  } as User;

  const mockLoginResponse: LoginResponseDto = {
    access_token: 'fake-jwt-token'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{provide: AuthService, useValue: mockAuthService}],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // =========================================================
  // TEST 1: El controlador debe estar definido
  // =========================================================

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup()', () => {

    // =========================================================
    // TEST 2: Registro exitoso 
    // =========================================================
    it('should return an user when signup is successful', async () => {
      mockAuthService.signup.mockResolvedValue(mockUser);

      const result: User = await controller.signup(mockSignupDto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(mockSignupDto);
      expect(result).toEqual(mockUser);
    })

    // =========================================================
    // TEST 3: Email ya existe - ConflictException
    // =========================================================
    it('should throw ConflictException when email already exists', async () => {
  
      const conflictError = new ConflictException('User with that email already exists');
      mockAuthService.signup.mockRejectedValue(conflictError);

      await expect(controller.signup(mockSignupDto))
        .rejects.toThrow(ConflictException);
    });
  })

  describe('login()', () => {

    // =========================================================
    // TEST 4: Login exitoso
    // =========================================================
    it('should return access token when login is successful', async () => {
    
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(mockLoginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(result).toEqual(mockLoginResponse);
    });

    // =========================================================
    // TEST 5: Credenciales inválidas - UnauthorizedException
    // =========================================================
    it('should throw UnauthorizedException when credentials are invalid', async () => {
    
      const unauthorizedError = new UnauthorizedException('Invalid credentials');
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(mockLoginDto))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('profile()', () => {
    // =========================================================
    // TEST 6: Obtener perfil exitoso
    // =========================================================
    it('should return user profile when valid JWT token', async () => {
      const mockRequest = {
        user: mockUser
      }

      const result: User | null = await controller.profile(mockRequest);

      expect(result).toEqual(mockUser);
    })
  })
    
});
