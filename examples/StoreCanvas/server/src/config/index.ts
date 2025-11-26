import { Env, loadEnv } from './env';

let cachedEnv: Env | null = null;

export const getConfig = (): Env => {
  if (cachedEnv) {
    return cachedEnv;
  }
  cachedEnv = loadEnv();
  return cachedEnv;
};
