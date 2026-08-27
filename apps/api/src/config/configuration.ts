export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  },
  http: {
    port: Number(process.env.PORT ?? 3101),
  },
  mail: {
    from: process.env.MAIL_FROM,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: Number(process.env.SMTP_PORT ?? 465),
    smtpSecure: process.env.SMTP_SECURE ?? "true",
    smtpUser: process.env.SMTP_USER,
    webUrl: process.env.WEB_URL ?? "http://localhost:3100",
  },
});
