import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(email: string, password: string): Promise<User> {
    const user = this.repo.create({ email, password, favorites: [] });
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async addFavorite(userId: string, pokemonId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    if (!user.favorites.includes(pokemonId)) user.favorites.push(pokemonId);
    await this.repo.save(user);
  }

  async removeFavorite(userId: string, pokemonId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    user.favorites = user.favorites.filter((id) => id !== pokemonId);
    await this.repo.save(user);
  }
}
