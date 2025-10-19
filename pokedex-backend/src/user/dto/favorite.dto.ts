import { IsString } from 'class-validator';

export class FavoriteDto {
  @IsString()
  pokemonId: string;
}
