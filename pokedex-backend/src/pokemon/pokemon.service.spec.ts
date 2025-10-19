import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PokemonService } from './pokemon.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PokemonService', () => {
  let service: PokemonService;
  let httpService: HttpService;
  let cacheManager: Cache;

  const cacheManagerMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const httpServiceMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonService,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    }).compile();

    service = module.get<PokemonService>(PokemonService);
    httpService = module.get<HttpService>(HttpService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  // =========================================================
  // TEST 1: findAll() Obtención de la lista de pokémon
  // =========================================================
  describe('findAll()', () => {
    it('should return a mapped list of pokemons', async () => {
      const mockApiResponse = {
        count: 2,
        results: [
          { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        ],
      };

      cacheManagerMock.get.mockResolvedValueOnce(null); // No hay caché
      httpServiceMock.get.mockReturnValueOnce(of({ data: mockApiResponse }));

      const result = await service.findAll({ limit: 2, offset: 0 });

      expect(result).toEqual({
        total: 2,
        results: [
          { id: '25', name: 'pikachu' },
          { id: '1', name: 'bulbasaur' },
        ],
      });

      expect(cacheManagerMock.set).toHaveBeenCalled(); // Se guarda en caché
    });

    it('should use cached data if available', async () => {
      const cachedApiResponse = {
        count: 1,
        results: [
          { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
        ],
      };
      cacheManagerMock.get.mockResolvedValueOnce(cachedApiResponse);

      const result = await service.findAll({ limit: 1, offset: 0 });

      expect(result).toEqual({
        total: 1,
        results: [{ id: '25', name: 'pikachu' }],
      });
      expect(httpServiceMock.get).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // TEST 2: getDetail() Obtención de los detalles técnicos de un pokemón
  // =========================================================
  describe('getDetail()', () => {
    it('should map Pokémon detail correctly with species and evolution', async () => {
      const mockApiResponse = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        types: [{ type: { name: 'electric' } }],
        abilities: [
          { ability: { name: 'static' }, is_hidden: false },
          { ability: { name: 'lightning-rod' }, is_hidden: true },
        ],
        stats: [{ base_stat: 90, stat: { name: 'speed' } }],
        sprites: { front_default: 'https://sprite.png' },
      };

      // Mocking getFromApi() since it's used inside getDetail()
      jest
        .spyOn(service as any, 'getFromApi')
        .mockResolvedValueOnce(mockApiResponse); // For /pokemon/25

      // Mock species + evolution chain methods
      jest.spyOn(service, 'getSpecies').mockResolvedValueOnce({
        id: 25,
        name: 'pikachu',
        color: 'yellow',
        habitat: 'forest',
        flavorText: 'Este Pokémon almacena electricidad.',
        evolutionChainUrl: 'https://pokeapi.co/api/v2/evolution-chain/10/',
      } as any);

      jest
        .spyOn(service as any, 'getEvolutionFromSpecies')
        .mockResolvedValueOnce(['pichu', 'pikachu', 'raichu']);

      const result = await service.getDetail(25);

      expect(result).toEqual({
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
      });

      expect(cacheManagerMock.set).toHaveBeenCalled();
    });

    it('should throw an HttpException if API fails', async () => {
      jest
        .spyOn(service as any, 'getFromApi')
        .mockRejectedValueOnce(
          new HttpException('Failed', HttpStatus.BAD_GATEWAY),
        );

      await expect(service.getDetail(25)).rejects.toThrow(HttpException);
    });
  });

  // =========================================================
  // TEST 3: getSpecies() Obtención de detalles de la especie de un pokemón
  // =========================================================
  describe('getSpecies()', () => {
    it('should extract Spanish flavor text and evolution URL', async () => {
      const mockApiResponse = {
        id: 25,
        name: 'pikachu',
        color: { name: 'yellow' },
        habitat: { name: 'forest' },
        flavor_text_entries: [
          {
            flavor_text: 'Este Pokémon almacena electricidad.',
            language: { name: 'es' },
          },
        ],
        evolution_chain: {
          url: 'https://pokeapi.co/api/v2/evolution-chain/10/',
        },
      };

      jest
        .spyOn(service as any, 'getFromApi')
        .mockResolvedValueOnce(mockApiResponse);

      const result = await service.getSpecies(25);

      expect(result).toEqual({
        id: 25,
        name: 'pikachu',
        color: 'yellow',
        habitat: 'forest',
        flavorText: 'Este Pokémon almacena electricidad.',
        evolutionChainUrl: 'https://pokeapi.co/api/v2/evolution-chain/10/',
      });
    });
  });

  // =========================================================
  // TEST 4: getEvolution() Obtención de la cadena evolutiva de un pokémon
  // =========================================================
  describe('getEvolution()', () => {
    it('should return evolution chain recursively', async () => {
      const speciesMock = {
        id: 25,
        name: 'pikachu',
        evolutionChainUrl: 'https://pokeapi.co/api/v2/evolution-chain/10/',
      };

      const chainMock = {
        id: 10,
        chain: {
          species: { name: 'pichu' },
          evolves_to: [
            {
              species: { name: 'pikachu' },
              evolves_to: [{ species: { name: 'raichu' }, evolves_to: [] }],
            },
          ],
        },
      };

      jest
        .spyOn(service, 'getSpecies')
        .mockResolvedValueOnce(speciesMock as any);
      jest.spyOn(service as any, 'getFromApi').mockResolvedValueOnce(chainMock);

      const result = await service.getEvolution(25);

      expect(result).toEqual({
        id: 10,
        chain: {
          name: 'pichu',
          evolvesTo: [
            {
              name: 'pikachu',
              evolvesTo: [{ name: 'raichu', evolvesTo: [] }],
            },
          ],
        },
      });
    });

    it('should throw if no evolution chain is found', async () => {
      jest
        .spyOn(service, 'getSpecies')
        .mockResolvedValueOnce({ evolutionChainUrl: null } as any);
      await expect(service.getEvolution(25)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  // =========================================================
  // TEST 5: listTypes() Obtención de la lista de todos los tipos de pokemón
  // =========================================================
  describe('listTypes()', () => {
    it('should translate Pokémon types to Spanish', async () => {
      const mockApiResponse = {
        results: [
          { name: 'fire' },
          { name: 'water' },
          { name: 'unknown' },
          { name: 'shadow' },
        ],
      };

      jest
        .spyOn(service as any, 'getFromApi')
        .mockResolvedValueOnce(mockApiResponse);

      const result = await service.listTypes();

      expect(result).toEqual({
        total: 2,
        types: ['fuego', 'agua'],
      });
    });
  });

  // =========================================================
  // TEST 6: getByType() - Pokémon filtered by type
  // =========================================================
  describe('getByType()', () => {
    it('should return mapped Pokémon list by type', async () => {
      const mockApiResponse = {
        name: 'electric',
        pokemon: [
          {
            pokemon: {
              name: 'pikachu',
              url: 'https://pokeapi.co/api/v2/pokemon/25/',
            },
          },
          {
            pokemon: {
              name: 'magnemite',
              url: 'https://pokeapi.co/api/v2/pokemon/81/',
            },
          },
        ],
      };

      cacheManagerMock.get.mockResolvedValueOnce(null); // No cache
      httpServiceMock.get.mockReturnValueOnce(of({ data: mockApiResponse }));

      const result = await service.getByType('electric');

      expect(result).toEqual({
        name: 'electric',
        pokemons: [
          { id: '25', name: 'pikachu' },
          { id: '81', name: 'magnemite' },
        ],
      });

      expect(cacheManagerMock.set).toHaveBeenCalled();
    });

    it('should use cached data if available', async () => {
      const cached = {
        name: 'electric',
        pokemons: [{ id: '25', name: 'pikachu' }],
      };

      cacheManagerMock.get.mockResolvedValueOnce(cached);

      const result = await service.getByType('electric');

      expect(result).toEqual(cached);
      expect(httpServiceMock.get).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // TEST 7: getEvolutionFromSpecies() - Extracting evolution names
  // =========================================================
  describe('getEvolutionFromSpecies()', () => {
    const speciesMock = {
      id: 25,
      evolutionChainUrl: 'https://pokeapi.co/api/v2/evolution-chain/10/',
    };

    it('should return mapped evolution names', async () => {
      const chainMock = {
        chain: {
          species: { name: 'pichu' },
          evolves_to: [
            {
              species: { name: 'pikachu' },
              evolves_to: [{ species: { name: 'raichu' }, evolves_to: [] }],
            },
          ],
        },
      };

      cacheManagerMock.get.mockResolvedValueOnce(null); // no cache
      httpServiceMock.get.mockReturnValueOnce(of({ data: chainMock }));

      const result = await (service as any).getEvolutionFromSpecies(
        speciesMock,
      );

      expect(result).toEqual(['pichu', 'pikachu', 'raichu']);
      expect(cacheManagerMock.set).toHaveBeenCalled();
    });

    it('should return cached evolution chain if available', async () => {
      const cached = ['pichu', 'pikachu', 'raichu'];
      cacheManagerMock.get.mockResolvedValueOnce(cached);

      const result = await (service as any).getEvolutionFromSpecies(
        speciesMock,
      );
      expect(result).toEqual(cached);
      expect(httpServiceMock.get).not.toHaveBeenCalled();
    });

    it('should return empty array if species has no evolutionChainUrl', async () => {
      const noChainSpecies = { id: 99, evolutionChainUrl: null };
      const result = await (service as any).getEvolutionFromSpecies(
        noChainSpecies,
      );
      expect(result).toEqual([]);
    });
  });
});
