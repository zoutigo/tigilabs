import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

type AuthMailPayload = {
  to: string;
  name: string;
  url: string;
};

@Injectable()
export class AuthMailService {
  constructor(private readonly configService: ConfigService) {}

  private getMailerConfig() {
    const host = this.configService.get<string>("SMTP_HOST");
    const port = Number(this.configService.get<string>("SMTP_PORT") ?? 465);
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");
    const secure =
      String(this.configService.get<string>("SMTP_SECURE") ?? "true") ===
      "true";
    const from = this.configService.get<string>("MAIL_FROM") ?? user;

    if (!host || !user || !pass || !from) {
      throw new InternalServerErrorException("SMTP configuration missing");
    }

    return { host, port, user, pass, secure, from };
  }

  async sendEmailConfirmation(payload: AuthMailPayload) {
    await this.sendMail({
      to: payload.to,
      subject: "Tigilabs - Confirmez votre adresse email",
      text: [
        `Bonjour ${payload.name},`,
        "",
        "Confirmez votre adresse email pour activer votre compte Tigilabs.",
        payload.url,
        "",
        "Ce lien expire dans 24 heures.",
      ].join("\n"),
      html: this.renderActionEmail({
        title: "Confirmez votre adresse email",
        greeting: `Bonjour ${payload.name},`,
        body: "Confirmez votre adresse email pour activer votre compte Tigilabs.",
        actionLabel: "Confirmer mon email",
        actionUrl: payload.url,
        footer: "Ce lien expire dans 24 heures.",
      }),
    });
  }

  async sendPasswordReset(payload: AuthMailPayload) {
    await this.sendMail({
      to: payload.to,
      subject: "Tigilabs - Reinitialisation du mot de passe",
      text: [
        `Bonjour ${payload.name},`,
        "",
        "Utilisez ce lien pour definir un nouveau mot de passe.",
        payload.url,
        "",
        "Ce lien expire dans 1 heure.",
      ].join("\n"),
      html: this.renderActionEmail({
        title: "Reinitialisation du mot de passe",
        greeting: `Bonjour ${payload.name},`,
        body: "Utilisez ce lien pour definir un nouveau mot de passe.",
        actionLabel: "Changer mon mot de passe",
        actionUrl: payload.url,
        footer: "Ce lien expire dans 1 heure.",
      }),
    });
  }

  private async sendMail(message: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }) {
    const { host, port, user, pass, secure, from } = this.getMailerConfig();
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({ from, ...message });
  }

  private renderActionEmail({
    title,
    greeting,
    body,
    actionLabel,
    actionUrl,
    footer,
  }: {
    title: string;
    greeting: string;
    body: string;
    actionLabel: string;
    actionUrl: string;
    footer: string;
  }) {
    const safeTitle = this.escapeHtml(title);
    const safeGreeting = this.escapeHtml(greeting);
    const safeBody = this.escapeHtml(body);
    const safeActionLabel = this.escapeHtml(actionLabel);
    const safeActionUrl = this.escapeHtml(actionUrl);
    const safeFooter = this.escapeHtml(footer);

    return `
<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f7f8fb;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;background:#f7f8fb;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d9dee8;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#176b87;padding:18px 24px;color:#ffffff;font-size:20px;font-weight:700;">Tigilabs</td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">${safeTitle}</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${safeGreeting}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">${safeBody}</p>
                <p style="margin:0 0 24px;">
                  <a href="${safeActionUrl}" style="display:inline-block;background:#176b87;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:700;">${safeActionLabel}</a>
                </p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#667085;">${safeFooter}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
