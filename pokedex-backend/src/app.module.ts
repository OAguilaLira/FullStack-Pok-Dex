import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PokemonModule } from './pokemon/pokemon.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration } from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { getRelevantConfig } from './config/config.utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration], 
      envFilePath: process.env.NODE_ENV
                ? `.env.${process.env.NODE_ENV}`
                : '.development.env',
      validate: (config) => {
        // Filtrar solo las variables relevantes usando la función que acabamos de crear
        const relevantConfig = getRelevantConfig(config);

        // Validar solo las variables relevantes
        const { error, value } = envValidationSchema.validate(relevantConfig, {
          abortEarly: false,
        });

        if (error) {
          // Si hay errores, los manejamos y los mostramos de una manera más amigable
          const missingVars = error.details.map(
            (detail) => `- ${detail.path.join('.')}`, // Esto va a listar las variables faltantes
          );

          // Lanza un error con el mensaje formateado
          throw new Error(`
Config validation error:
The following environment variables are missing or invalid:
${missingVars.join('\n')}

Please ensure that all required environment variables are defined in your configuration file or environment.
          `.trim());
        }

        return value; // Si todo está bien, devuelve las variables de entorno validadas
      },
      validationOptions: {
        allowUnknown: true, // Permite variables desconocidas (aunque no sean parte del esquema)
        abortEarly: false, // No se detiene en el primer error
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 segundos,
        limit: 5, // Limite de 5 peticiones por periodo de tiempo, en este caso 60 segundos
      },
    ]),
    CacheModule.register(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('DB_CONFIG')
        if (!dbConfig) {
          throw new Error('Database configuration is missing in ConfigService');
        }
        return dbConfig;
      }
    }),
    PokemonModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }