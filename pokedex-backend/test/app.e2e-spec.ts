import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { PokemonService } from 'src/pokemon/pokemon.service';

let pokemonService: PokemonService;

const mockPokemonService = {
  findAll: jest.fn().mockResolvedValue({
    total: 1350,
    results: [
      { id: '1', name: 'bulbasaur' },
      { id: '2', name: 'ivysaur' },
    ],
  }),
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideProvider(PokemonService)
      .useValue(mockPokemonService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }));

    await app.init();

    pokemonService = app.get<PokemonService>(PokemonService);

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  // ==============================================================
  // TEST 1: El método findAll() debe retornar una lista de pokémon
  // ==============================================================
  it('/pokemon (GET) - should return a mapped list of pokemons', async () => {
    const limit = 2;
    const offset = 0;

    const response = await request(app.getHttpServer())
      .get(`/pokemon?limit=${limit}&offset=${offset}`)
      .expect(200);

    expect(response.body.results).toHaveLength(2);

    expect(pokemonService.findAll).toHaveBeenCalledWith({
      limit: limit, 
      offset: offset, 
    });

  })

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
