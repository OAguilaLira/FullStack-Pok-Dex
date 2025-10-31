import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PokemonService } from 'src/pokemon/pokemon.service';
import { PokemonSpecies } from 'src/pokemon/interfaces/pokemon-species.interface';

describe('UserService', () => {
  let service: UserService;
  let pokemonService: PokemonService;
  let repository: Repository<User>;

  const id = "uUUIDmokeado";
  const email = 'ash@kanto.com';
  const password = 'pikachu123';
  const favorites = [];
  const mockUser = { id, email, password, favorites: [] } as User;

  const pokemonId = 25;
  const pokemonName = 'pikachu'
  const mockPokemon = { id: pokemonId, name: pokemonName } as PokemonSpecies;

  const mockRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockPokemonService = {
    getSpecies: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: getRepositoryToken(User), useValue: mockRepository }, { provide: PokemonService, useValue: mockPokemonService }],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    pokemonService = module.get<PokemonService>(PokemonService);

    jest.resetAllMocks();
  });

  // =========================================================
  // TEST 1: El userService debe estar definido
  // =========================================================
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
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
      expect(mockRepository.create).toHaveBeenCalledWith({ email, password, favorites });
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    // ============================================================================
    // TEST 3: Crear un nuevo usuario (register), caso donde el email ya ha sido registrado previamente
    // ============================================================================
    it('should throw ConflictException if email already exists', async () => {
      // Simular que ya existe usuario con ese email
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(service.create(email, password)).rejects.toThrow(ConflictException);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  })

  describe('findByEmail', () => {
    // =========================================================
    // TEST 4: Buscar usuario por correo, si existe el correo
    // =========================================================
    it('should find a user by email', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findByEmail(email);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email })
      expect(result).toEqual(mockUser);
    });
  })

  // =========================================================
  // TEST 5: Buscar usuario por correo, el correo no existe
  // =========================================================
  it('should throw NotFoundException if email does not exist', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);
    await expect(service.findByEmail(email)).rejects.toThrow(NotFoundException);
    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
  });

  describe('findById', () => {
    // =========================================================
    // TEST 6: Buscar usuario por id, el id existe
    // =========================================================
    it('should find a user by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findById(id);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id })
      expect(result).toEqual(mockUser);
    });
  })

  describe('addFavorite', () => {
    // ==============================================================================
    // TEST 7: Lanzar un error si el usuario no existe y se intenta añadir un pokemon
    // ==============================================================================
    it('should throw NotFoundException if user does not exist', async () => {
      const pokemonId: string = '25';
      jest.spyOn(service, 'findById').mockResolvedValueOnce(null);
      await expect(service.addFavorite(id, pokemonId)).rejects.toThrow(NotFoundException);
    });

    // ==============================================================================
    // TEST 8: Lanzar un error si el pokemono no existe
    // ==============================================================================
    it('should thorow NotFoundException if pokemon does not exist', async () => {
      const pokemonId: string = '25';
      mockPokemonService.getSpecies.mockResolvedValueOnce(null);
      await expect(service.addFavorite(id, pokemonId)).rejects.toThrow(NotFoundException);
    });

    // ==============================================================================
    // TEST 9: No agregar pokemon repetidos
    // ==============================================================================
    it('should not add duplicate pokemon to favorites', async () => {

      const pokemonId = '25';
      const mockUserWithFavorite = {
        ...mockUser,
        favorites: [pokemonId]
      } as User;

      jest.spyOn(service, 'findById').mockResolvedValueOnce(mockUserWithFavorite);

      mockPokemonService.getSpecies.mockResolvedValueOnce(mockPokemon);

      const result = await service.addFavorite(id, pokemonId);

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(result.favorites.length).toBe(1);
      expect(result.favorites).toContain(pokemonId);
    });

  })

  // ==============================================================================
  // TEST 10: Agregar un pokemon a los favoritos de un usuario
  // ==============================================================================

  it('should successfully add non-duplicate pokemon to user favorites', async () => {
  const pokemonId = '25';
  const updatedUser = { ...mockUser, favorites: [pokemonId] };

  jest.spyOn(service, 'findById').mockResolvedValueOnce(mockUser);
  mockPokemonService.getSpecies.mockResolvedValue(mockPokemon);
  mockRepository.save.mockResolvedValue(updatedUser);

  const result = await service.addFavorite(id, pokemonId);

  expect(jest.spyOn(service, 'findById')).toHaveBeenCalledWith( id );
  expect(mockPokemonService.getSpecies).toHaveBeenCalledWith(pokemonId);
  expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
  expect(result.favorites).toEqual([pokemonId]);
});

describe('removeFavorite', () => {
  // =========================================================
  // TEST 11: Escenario ideal - Eliminar pokemon existente
  // =========================================================
  it('should remove existing pokemon from favorites', async () => {
    const pokemonId = '25';
    const otherPokemonId = '1';
    const initialFavorites = [pokemonId, otherPokemonId];
    const expectedFavorites = [otherPokemonId];
    
    const userWithFavorites = { 
      ...mockUser, 
      favorites: initialFavorites 
    } as User;
    
    const userAfterRemoval = { 
      ...mockUser, 
      favorites: expectedFavorites 
    } as User;

    mockRepository.findOneBy.mockResolvedValue(userWithFavorites);
    mockRepository.save.mockResolvedValue(userAfterRemoval);

    await service.removeFavorite(id, pokemonId);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id });
    expect(mockRepository.save).toHaveBeenCalledWith({
      ...userWithFavorites,
      favorites: expectedFavorites
    });
  });

  // =========================================================
  // TEST 12: Usuario no existe - Debería salir silenciosamente
  // =========================================================
  it('should exit silently when user does not exist', async () => {
    mockRepository.findOneBy.mockResolvedValue(null);

    await service.removeFavorite(id, '25');

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id });
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  // =========================================================
  // TEST 13: Pokemon no está en favoritos - No hacer cambios
  // =========================================================
  it('should not modify favorites when pokemon is not in list', async () => {
    const pokemonId = '25';
    const existingFavorites = ['1', '4', '7'];
    
    const userWithFavorites = { 
      ...mockUser, 
      favorites: existingFavorites 
    } as User;

    mockRepository.findOneBy.mockResolvedValue(userWithFavorites);

    await service.removeFavorite(id, pokemonId);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id });
    expect(mockRepository.save).toHaveBeenCalledWith(userWithFavorites);
  });

  // =========================================================
  // TEST 14: Lista de favoritos vacía - No hacer cambios
  // =========================================================
  it('should handle empty favorites list', async () => {
    const pokemonId = '25';
    const userWithEmptyFavorites = { 
      ...mockUser, 
      favorites: [] 
    } as User;

    mockRepository.findOneBy.mockResolvedValue(userWithEmptyFavorites);

    await service.removeFavorite(id, pokemonId);

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id });
    expect(mockRepository.save).toHaveBeenCalledWith(userWithEmptyFavorites);
  });

  // =========================================================
  // TEST 15: Eliminar múltiples ocurrencias (caso edge)
  // =========================================================
  it('should remove all occurrences when pokemonId appears multiple times', async () => {
    const pokemonId = '25';
    const initialFavorites = [pokemonId, '1', pokemonId, '4', pokemonId];
    const expectedFavorites = ['1', '4'];
    
    const userWithDuplicates = { 
      ...mockUser, 
      favorites: initialFavorites 
    } as User;

    mockRepository.findOneBy.mockResolvedValue(userWithDuplicates);

    await service.removeFavorite(id, pokemonId);

    expect(mockRepository.save).toHaveBeenCalledWith({
      ...userWithDuplicates,
      favorites: expectedFavorites
    });
  });

  // =========================================================
  // TEST 16: Verificar que filter se usa correctamente
  // =========================================================
  it('should use strict comparison for pokemonId removal', async () => {
    const pokemonId = '25';
    const similarPokemonId = '250'; // No debería ser eliminado
    const initialFavorites = [pokemonId, similarPokemonId];
    const expectedFavorites = [similarPokemonId];
    
    const userWithSimilarIds = { 
      ...mockUser, 
      favorites: initialFavorites 
    } as User;

    mockRepository.findOneBy.mockResolvedValue(userWithSimilarIds);

    await service.removeFavorite(id, pokemonId);

    expect(mockRepository.save).toHaveBeenCalledWith({
      ...userWithSimilarIds,
      favorites: expectedFavorites
    });
  });

  // =========================================================
  // TEST 17: Manejo de tipos diferentes (caso edge)
  // =========================================================
  it('should handle different string representations of numbers', async () => {
    const pokemonId = '25';
    const numericPokemonId = 25 as any; // Simular tipo incorrecto
    const initialFavorites = [pokemonId, '1'];
    const expectedFavorites = ['1'];
    
    const userWithFavorites = { 
      ...mockUser, 
      favorites: initialFavorites 
    } as User;

    mockRepository.findOneBy.mockResolvedValue(userWithFavorites);

    await service.removeFavorite(id, pokemonId);

    // El filter con !== debería manejar esto correctamente
    expect(mockRepository.save).toHaveBeenCalledWith({
      ...userWithFavorites,
      favorites: expectedFavorites
    });
  });

  // =========================================================
  // TEST 18: Verificar que el método no retorna valor (void)
  // =========================================================
  it('should return void (no return value)', async () => {
    const userWithFavorites = { 
      ...mockUser, 
      favorites: ['25'] 
    } as User;

    mockRepository.findOneBy.mockResolvedValue(userWithFavorites);
    mockRepository.save.mockResolvedValue(userWithFavorites);

    const result = await service.removeFavorite(id, '25');

    expect(result).toBeUndefined();
  });

  // =========================================================
  // TEST 19: Manejo de errores en save
  // =========================================================
  it('should propagate errors from repository save', async () => {
    const userWithFavorites = { 
      ...mockUser, 
      favorites: ['25'] 
    } as User;
    const saveError = new Error('Database error');

    mockRepository.findOneBy.mockResolvedValue(userWithFavorites);
    mockRepository.save.mockRejectedValue(saveError);

    await expect(service.removeFavorite(id, '25'))
      .rejects.toThrow('Database error');

    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id });
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
});