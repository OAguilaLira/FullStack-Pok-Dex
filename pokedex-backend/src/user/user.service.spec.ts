import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const id = "uUUIDmokeado";
  const email = 'ash@kanto.com';
  const password = 'pikachu123';
  const favorites = [];
  const mockUser = { id, email, password, favorites: [] } as User;

  const mockRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockService = {
    addFavorite: jest.fn(),
    findById: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: getRepositoryToken(User), useValue: mockRepository }],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  // =========================================================
  // TEST 1: El userService debe estar definido
  // =========================================================
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========================================================================
  // TEST 2: Crear un nuevo usuario (register), caso donde no existe el email
  // ========================================================================
  it('should hash password and create a new user', async () => {
    mockRepository.create.mockReturnValueOnce(mockUser);
    mockRepository.save.mockResolvedValueOnce(mockUser);
    mockRepository.findOneBy.mockResolvedValue(null);

    const result = await service.create(
      email,
      password,
    );

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
    expect(mockRepository.create).toHaveBeenCalledWith({ email, password, favorites});
    expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockUser);
  });

  // ============================================================================
  // TEST 3: Crear un nuevo usuario (register), caso donde el email está repetido
  // ============================================================================
  it('should throw ConflictException if email already exists', async () => {
    // Simular que ya existe usuario con ese email
    mockRepository.findOneBy.mockResolvedValue(mockUser);

    await expect(service.create(email, password)).rejects.toThrow(ConflictException);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });


  // =========================================================
  // TEST 4: Buscar usuario por correo, si existe el correo
  // =========================================================
  it('should find a user by email', async () => {
    mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
    const result = await service.findByEmail(email);
    expect(mockRepository.findOneBy).toHaveBeenCalledWith({email})
    expect(result).toEqual(mockUser);
  });

  // =========================================================
  // TEST 5: Buscar usuario por correo, si existe el correo
  // =========================================================
  it('should throw NotFoundException if email does not exist', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);
    await expect(service.findByEmail(email)).rejects.toThrow(NotFoundException);
    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
  });

  // ==============================================================================
  // TEST 5: Lanzar un error si el usuario no existe y se intenta añadir un pokemon
  // ==============================================================================
  it('should throw NotFoundException if user does not exist', async () => {
    const pokemonId: string = '25';
    await expect(service.addFavorite(id, pokemonId)).rejects.toThrow(NotFoundException);
    expect(mockService.findById).toHaveBeenCalledWith(id);
  });

});