/**
 * Interfaz para definir la estructura de la respuesta de la PokéAPI
 * Url: https://pokeapi.co/api/v2/pokemon?limit=20&offset=0
 */
export interface PokeApiListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    name: string;
    url: string;
  }[];
}
