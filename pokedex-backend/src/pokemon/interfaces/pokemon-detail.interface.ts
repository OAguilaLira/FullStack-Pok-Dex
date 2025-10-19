export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  abilities: { name: string; hidden: boolean }[];
  stats: { name: string; base: number }[];
  sprite: string;
  flavorText?: string;
  evolution?: string[];
}
