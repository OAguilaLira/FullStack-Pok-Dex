import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { User } from 'src/user/entities/user.entity';
import { create } from 'axios';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
    verify: jest.fn(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockSignupDto: SignupDto = {
    email: 'misty@cerulean.com',
    password: 'starmie123'
  };

  const mockHashedPassword = 'hashed_starmie123';
  const mockCreatedUser = {
    id: 'new-user-id',
    email: mockSignupDto.email,
    password: mockHashedPassword,
    favorites: []
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: UserService, useValue: mockUserService }, { provide: JwtService, useValue: mockJwtService }],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signup', () => {
    // =========================================================
    // TEST 1: Registro exitoso - Happy Path
    // =========================================================
    it('should successfully register a new user when email does not exist', async () => {

      mockUserService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
      mockUserService.create.mockResolvedValue(mockCreatedUser);

      const result = await authService.signup(mockSignupDto);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(mockSignupDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockSignupDto.password, 10);
      expect(mockUserService.create).toHaveBeenCalledWith(
        mockSignupDto.email,
        mockHashedPassword
      );
      expect(result).toEqual(mockCreatedUser);
    });

    // =========================================================
    // TEST 2: Email ya existe - ConflictException
    // =========================================================
    it('should throw ConflictException when email already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        email: mockSignupDto.email,
        password: 'existing-hash'
      } as User;

      mockUserService.findByEmail.mockResolvedValue(existingUser);

      await expect(authService.signup(mockSignupDto))
        .rejects.toThrow(ConflictException);
      await expect(authService.signup(mockSignupDto))
        .rejects.toThrow('User with that email already exists');

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    // =========================================================
    // TEST 3: Validación de tipo de retorno
    // =========================================================
    it('should return User object with correct structure', async () => {
      jest.spyOn(mockUserService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(mockHashedPassword as never);
      jest.spyOn(mockUserService, 'create').mockResolvedValue(mockCreatedUser);

      const result = await authService.signup(mockSignupDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', mockSignupDto.email);
      expect(result).toHaveProperty('password', mockHashedPassword);
      expect(result).not.toHaveProperty('password', mockSignupDto.password);
    });
  })
});
