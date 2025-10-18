import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ListQueryDto } from './dto/list-query.dto';
import { PokeApiListResponse } from './interfaces/pokeapi-list-response.interface';
import { PokemonBasic } from './interfaces/pokemon-basic.interface';
import { PokemonListResponse } from './interfaces/pokemon-list-response.interface';

@Injectable()
export class PokemonService {
  constructor(private readonly httpService: HttpService) {}
  
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  async findAll(query: ListQueryDto):Promise<PokemonListResponse> {
    const url:string = `${this.baseUrl}/pokemon?limit=${query.limit}&offset=${query.offset}`;

    try {
      const response:AxiosResponse<PokeApiListResponse> = await firstValueFrom(this.httpService.get<PokeApiListResponse>(url));
    
      const results:PokemonBasic[] = response.data.results.map((p) => ({
        name: p.name,
        id: this.extractIdFromUrl(p.url),
      }));

      return {
        total: response.data.count,
        results,
      };
    } catch (error) {
      throw new HttpException(
        'Error al obtener Pokémon desde PokéAPI',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
  

  findOne(id: number) {
    return `This action returns a #${id} pokemon`;
  }

  update(id: number, updatePokemonDto: UpdatePokemonDto) {
    return `This action updates a #${id} pokemon`;
  }

  remove(id: number) {
    return `This action removes a #${id} pokemon`;
  }

  private extractIdFromUrl(url: string) {
    // Extraer el ID del pokemon de la URL proporcionada por la PokeApi
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
}
