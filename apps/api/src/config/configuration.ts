export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  },
  http: {
    port: Number(process.env.PORT ?? 3001),
  },
});
