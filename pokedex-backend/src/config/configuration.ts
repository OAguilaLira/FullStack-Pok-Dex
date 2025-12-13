import { registerAs } from "@nestjs/config";
import { DataSource, DataSourceOptions } from "typeorm";

export const configuration = () => ({
  PORT: parseInt(process.env.PORT || '3000', 10),
  DB_CONFIG: {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ['dist/**/*.entity{.ts,.js}'],
    autoLoadEntities: true,
    dropSchema: false,
    synchronize: true,
    logging: false,
}
});