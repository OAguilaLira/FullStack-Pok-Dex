import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ListQueryDto } from './dto/list-query.dto';
import { PokeApiListResponse } from './interfaces/pokeapi-list-response.interface';
import { PokemonListResponse } from './interfaces/pokemon-list-response.interface';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PokemonDetail } from './interfaces/pokemon-detail.interface';
import { PokemonSpecies } from './interfaces/pokemon-species.interface';
import { EvolutionNode, PokemonEvolution } from './interfaces/pokekmon-evolution.interface';
import { PokemonTypesResponse } from './interfaces/pokemon-types.interface';


@Injectable()
export class PokemonService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private readonly defaultTTL = 300000; // En milisegundos, equivale a 5 minutos

  private async getFromApi<T>(path: string, ttl = this.defaultTTL): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const cached = await this.cacheManager.get<T>(url);
    if (cached) return cached;
    
    try {
      const response = await firstValueFrom(this.httpService.get<T>(url));
      await this.cacheManager.set(url, response.data, ttl);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch data from PokéAPI: ${path}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // Listado básico de los pokémon
  async findAll(query: ListQueryDto): Promise<PokemonListResponse> {
    const pokemonListTTL = 600000 // Equivalente a 10 minutos
    const url: string = `/pokemon?limit=${query.limit}&offset=${query.offset}`;
    const data = await this.getFromApi<PokeApiListResponse>(url, pokemonListTTL);
    
    return {
      total: data.count,
      results: data.results.map((p) => ({
        id: this.extractIdFromUrl(p.url),
        name: p.name,
      })),
    };
    
  }

  // Obtener los detalles técnicos de un pokémon
  async getDetail(id: string | number): Promise<PokemonDetail> {
    const data = await this.getFromApi<any>(`/pokemon/${id}`, 1800);

    return {
      id: data.id,
      name: data.name,
      height: data.height,
      weight: data.weight,
      types: data.types.map((typeObject) => this.translateType(typeObject.type.name)),
      abilities: data.abilities.map((abilityObject) => ({
        name: abilityObject.ability.name,
        hidden: abilityObject.is_hidden,
      })),
      stats: data.stats.map((statObject) => ({
        name: statObject.stat.name,
        base: statObject.base_stat,
      })),
      sprite: data.sprites.front_default,
    };
  }

  // Obtener detalles biológicos y de contexto de un pokémon
  async getSpecies(id: string | number): Promise<PokemonSpecies> {
    const data = await this.getFromApi<any>(`/pokemon-species/${id}`, 3600);
    const flavor = data.flavor_text_entries.find(
      (entry) => entry.language.name === 'es' || entry.language.name === 'en',
    );

    return {
      id: data.id,
      name: data.name,
      color: data.color?.name,
      habitat: data.habitat?.name,
      flavorText: flavor
        ? flavor.flavor_text.replace(/[\n\f]/g, ' ')
        : undefined,
      evolutionChainUrl: data.evolution_chain?.url,
    };
  }

  // Obtener la cadena evolutiva de un pokémon
  async getEvolution(id: string | number): Promise<PokemonEvolution> {
    const species = await this.getSpecies(id);
    if (!species.evolutionChainUrl) {
      throw new HttpException(
        'No evolution chain found for this Pokémon.',
        HttpStatus.NOT_FOUND,
      );
    }

    const chainData = await this.getFromApi<any>(
      species.evolutionChainUrl.replace(this.baseUrl, ''),
      3600,
    );

    const mapChain = (node: any): EvolutionNode => ({
      name: node.species.name,
      evolvesTo: node.evolves_to.map(mapChain),
    });

    return {
      id: chainData.id,
      chain: mapChain(chainData.chain),
    };
  }

  // Obtener el listado de los tipos de pokémon que existen
  async listTypes(): Promise<PokemonTypesResponse> {
    const data = await this.getFromApi<any>('/type', 7200);
    const types = data.results
      .map((result) => result.name)
      .filter((typeName) => typeName !== 'unknown' && typeName !== 'shadow')
      .map((typeName) => this.translateType(typeName));

    return { total: types.length, types };
  }


  private extractIdFromUrl(url: string) {
    // Extraer el ID del pokemon de la URL proporcionada por la PokeApi
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }

  private translateType(type: string): string {
    const map: Record<string, string> = {
      normal: 'normal',
      fire: 'fuego',
      water: 'agua',
      grass: 'planta',
      electric: 'eléctrico',
      ice: 'hielo',
      fighting: 'lucha',
      poison: 'veneno',
      ground: 'tierra',
      flying: 'volador',
      psychic: 'psíquico',
      bug: 'bicho',
      rock: 'roca',
      ghost: 'fantasma',
      dragon: 'dragón',
      dark: 'siniestro',
      steel: 'acero',
      fairy: 'hada',
    };
    return map[type] || type;
  }
}
