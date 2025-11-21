import { Test, TestingModule } from '@nestjs/testing';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

describe('PokemonController', () => {
  let controller: PokemonController;
  const mockPokemonService = {
    findAll: jest.fn(),
    getDetail: jest.fn(),
    getSpecies: jest.fn(),
    getEvolution: jest.fn(),
    listTypes: jest.fn(),
    getByType: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, CacheModule.register()],
      controllers: [PokemonController],
      providers: [{provide: PokemonService, useValue: mockPokemonService}],
    }).compile();

    controller = module.get<PokemonController>(PokemonController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // =========================================================
  // TEST 1: El controlador debe estar definido 
  // =========================================================

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll()', () => {
    // ==============================================================
    // TEST 2: El método findAll() debe retornar una lista de pokémon
    // ==============================================================
    it('should return a mapped list of pokemons', async () => {

      const mockRequestDto = { limit: 2, offset: 0 }

      const mockListPokemon = {
        total: 2,
        results: [
          { id: '25', name: 'pikachu' },
          { id: '1', name: 'bulbasaur' },
        ],
      }

      mockPokemonService.findAll.mockResolvedValue(mockListPokemon);
      const result = await controller.findAll(mockRequestDto)
      expect(mockPokemonService.findAll).toHaveBeenCalledWith(mockRequestDto);
      expect(result).toEqual(mockListPokemon)
    })
  })

  describe('detail()', () => {
    // ===================================================================
    // TEST 3: El método detail() debe retornar los detalles de un pokémon
    // ===================================================================
    it('should return a mapped list of pokemons', async () => {

      const mockPokemonId = '2';

      const mockDetailPokemon = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        types: ['eléctrico'],
        abilities: [
          { name: 'static', hidden: false },
          { name: 'lightning-rod', hidden: true },
        ],
        stats: [{ name: 'speed', base: 90 }],
        sprite: 'https://sprite.png',
        flavorText: 'Este Pokémon almacena electricidad.',
        evolution: ['pichu', 'pikachu', 'raichu'],
      }

      mockPokemonService.getDetail.mockResolvedValue(mockDetailPokemon);
      const result = await controller.detail(mockPokemonId)
      expect(mockPokemonService.getDetail).toHaveBeenCalledWith(mockPokemonId);
      expect(result).toEqual(mockDetailPokemon)
    })
  })
});
