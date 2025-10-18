import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PokemonModule } from './pokemon/pokemon.module';
import configuration from 'config/configuration';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
     PokemonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
