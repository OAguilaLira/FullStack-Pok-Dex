export interface PokemonEvolution {
  id: number;
  chain: EvolutionNode;
}

export interface EvolutionNode {
  name: string;
  evolvesTo: EvolutionNode[];
}
