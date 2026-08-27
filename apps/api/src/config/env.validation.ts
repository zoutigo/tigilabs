type Env = Record<string, string | undefined>;

export function validateEnv(config: Env) {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  return config;
}
