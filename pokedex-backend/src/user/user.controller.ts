import { Body, Controller, Delete, Get, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PokemonService } from '../pokemon/pokemon.service';
import { FavoriteDto } from './dto/favorite.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService, private readonly pokemonService: PokemonService) {}

  @Get('favorites')
  async getFavorites(@Req() req) {
    const user = await this.userService.findById(req.user.sub);
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    if (!user.favorites || user.favorites.length === 0) {
  return { favorites: [] };
}

    // Mapea los IDs a información completa usando tu PokemonService
    const favorites = await Promise.all(
      user.favorites.map(async (id) => {
        try {
          const pokemon = await this.pokemonService.getDetail(id);
          return { id, name: pokemon.name, sprite: pokemon.sprite };
        } catch {
          return { id, name: `Pokémon #${id}`, sprite: null };
        }
      }),
    );

    return { favorites };
  }

  @Post('favorites')
  async addFavorite(@Req() req, @Body() body: FavoriteDto) {
    const userId = req.user.sub;
    const { pokemonId } = body;

    await this.userService.addFavorite(userId, pokemonId);
    return { message: `Pokémon ${pokemonId} agregado a favoritos.` };
  }

  @Delete('favorites')
  async removeFavorite(@Req() req, @Body() body: FavoriteDto) {
    const userId = req.user.sub;
    const { pokemonId } = body;

    await this.userService.removeFavorite(userId, pokemonId);
    return { message: `Pokémon ${pokemonId} eliminado de favoritos.` };
  }
}
