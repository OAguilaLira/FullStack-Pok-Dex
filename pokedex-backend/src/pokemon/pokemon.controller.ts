import { Controller, Get, Param, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { ListQueryDto } from './dto/list-query.dto';
import { PokemonListResponse } from './interfaces/pokemon-list-response.interface';
import { PokemonDetail } from './interfaces/pokemon-detail.interface';
import { PokemonEvolution } from './interfaces/pokekmon-evolution.interface';
import { PokemonSpecies } from './interfaces/pokemon-species.interface';
import { PokemonTypesResponse } from './interfaces/pokemon-types.interface';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  async findAll(@Query() query:ListQueryDto): Promise<PokemonListResponse> {
    return this.pokemonService.findAll(query);
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<PokemonDetail> {
    return this.pokemonService.getDetail(id);
  }

  @Get('species/:id')
  async species(@Param('id') id: string): Promise<PokemonSpecies> {
    return this.pokemonService.getSpecies(id);
  }

  @Get('evolution/:id')
  async evolution(@Param('id') id: string): Promise<PokemonEvolution> {
    return this.pokemonService.getEvolution(id);
  }

  @Get('types')
  async types(): Promise<PokemonTypesResponse> {
    return this.pokemonService.listTypes();
  }
}
