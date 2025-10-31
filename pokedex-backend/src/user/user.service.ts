import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PokemonService } from 'src/pokemon/pokemon.service';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly pokemonService: PokemonService
  ) {}

  async create(email: string, password: string): Promise<User> {
    // Verificar si no se ha registrado previamente el correo ingresado
    const existing: User | null = await this.repo.findOneBy({ email });
    if (existing) {
      throw new ConflictException(`El correo ${email} ya está registrado`);
    }
    const user:User = this.repo.create({ email, password, favorites: [] });
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user:User | null = await this.repo.findOneBy({ email });
    if (!user) throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  async addFavorite(userId: string, pokemonId: string): Promise<User> {
    const user: User | null = await this.findById(userId);
    if (!user) throw new NotFoundException(`Usuario con id ${userId} no encontrado`);

    if (!Array.isArray(user.favorites)) {
      user.favorites = [];
    }

    const validPokemon: Pokemon | null = await this.pokemonService.getSpecies(pokemonId);
    if (!validPokemon) { 
      throw new NotFoundException(`El pokemon con id ${pokemonId} no es válido`)
    }


    if (user.favorites.includes(pokemonId)) {
      return user;
    }

    user.favorites.push(pokemonId);

    return this.repo.save(user);
  }

  async removeFavorite(userId: string, pokemonId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    user.favorites = user.favorites.filter((id) => id !== pokemonId);
    await this.repo.save(user);
  }
}
