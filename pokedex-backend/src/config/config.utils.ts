export const getRelevantConfig = (config: Record<string, any>) => ({
  DB_HOST: config.DB_HOST,
  DB_USERNAME: config.DB_USERNAME,
  DB_PASSWORD: config.DB_PASSWORD,
  DB_NAME: config.DB_NAME,
  JWT_SECRET: config.JWT_SECRET,
});
