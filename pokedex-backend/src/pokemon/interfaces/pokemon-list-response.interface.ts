import { PokemonBasic } from "./pokemon-basic.interface";

/**
 * Estructura de la Respuesta del listado de Pokémon devuelta por esta aplicación
 */
export interface PokemonListResponse {
  total: number;
  results: PokemonBasic[];
}