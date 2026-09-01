import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

export type EventMailPayload = {
  to: string;
  participantName: string;
  organizerName: string;
  eventTitle: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  location?: string | null;
  meetingUrl?: string | null;
  url: string;
  changesSummary?: string;
};

export type ReminderMailPayload = {
  to: string;
  participantName: string;
  eventTitle: string;
  startAt: string;
  location?: string | null;
  minutesBefore: number;
  url: string;
};

@Injectable()
export class CalendarMailService {
  constructor(private readonly configService: ConfigService) {}

  async sendInvitation(payload: EventMailPayload) {
    await this.sendMail({
      to: payload.to,
      subject: `Invitation - ${payload.eventTitle}`,
      html: this.renderEventEmail({
        title: "Vous etes invite(e) a un evenement",
        greeting: `Bonjour ${payload.participantName},`,
        body: `${payload.organizerName} vous invite a "${payload.eventTitle}".`,
        payload,
        actionLabel: "Voir l'evenement",
      }),
    });
  }

  async sendUpdate(payload: EventMailPayload) {
    await this.sendMail({
      to: payload.to,
      subject: `Modifie - ${payload.eventTitle}`,
      html: this.renderEventEmail({
        title: "Un evenement a ete modifie",
        greeting: `Bonjour ${payload.participantName},`,
        body:
          payload.changesSummary ??
          `"${payload.eventTitle}" a ete mis a jour par ${payload.organizerName}.`,
        payload,
        actionLabel: "Voir les nouveaux details",
      }),
    });
  }

  async sendCancellation(payload: EventMailPayload) {
    await this.sendMail({
      to: payload.to,
      subject: `Annule - ${payload.eventTitle}`,
      html: this.renderEventEmail({
        title: "Evenement annule",
        greeting: `Bonjour ${payload.participantName},`,
        body: `"${payload.eventTitle}" a ete annule par ${payload.organizerName}.`,
        payload,
        actionLabel: "Voir l'agenda",
      }),
    });
  }

  async sendReminder(payload: ReminderMailPayload) {
    await this.sendMail({
      to: payload.to,
      subject: `Rappel - ${payload.eventTitle}`,
      html: this.renderReminderEmail(payload),
    });
  }

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

  private async sendMail(message: {
    to: string;
    subject: string;
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

  private renderEventEmail({
    title,
    greeting,
    body,
    payload,
    actionLabel,
  }: {
    title: string;
    greeting: string;
    body: string;
    payload: EventMailPayload;
    actionLabel: string;
  }) {
    const when = payload.allDay
      ? this.formatDate(payload.startAt)
      : `${this.formatDateTime(payload.startAt)} - ${this.formatDateTime(payload.endAt)}`;

    return this.renderShell({
      title,
      greeting,
      body,
      details: [
        ["Quand", when],
        payload.location ? ["Lieu", payload.location] : undefined,
        payload.meetingUrl
          ? ["Visioconference", payload.meetingUrl]
          : undefined,
      ].filter(Boolean) as Array<[string, string]>,
      actionLabel,
      actionUrl: payload.url,
    });
  }

  private renderReminderEmail(payload: ReminderMailPayload) {
    return this.renderShell({
      title: "Rappel de rendez-vous",
      greeting: `Bonjour ${payload.participantName},`,
      body: `Votre evenement "${payload.eventTitle}" commence dans ${this.formatMinutes(payload.minutesBefore)}.`,
      details: [
        ["Quand", this.formatDateTime(payload.startAt)],
        payload.location ? ["Lieu", payload.location] : undefined,
      ].filter(Boolean) as Array<[string, string]>,
      actionLabel: "Voir l'evenement",
      actionUrl: payload.url,
    });
  }

  private renderShell({
    title,
    greeting,
    body,
    details,
    actionLabel,
    actionUrl,
  }: {
    title: string;
    greeting: string;
    body: string;
    details: Array<[string, string]>;
    actionLabel: string;
    actionUrl: string;
  }) {
    const safe = (value: string) => this.escapeHtml(value);
    const detailsHtml = details
      .map(
        ([label, value]) =>
          `<p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>${safe(label)}:</strong> ${safe(value)}</p>`,
      )
      .join("");

    return `
<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f7f8fb;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;background:#f7f8fb;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d9dee8;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#176b87;padding:18px 24px;color:#ffffff;font-size:20px;font-weight:700;">Tigilabs Agenda</td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">${safe(title)}</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${safe(greeting)}</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${safe(body)}</p>
                <div style="margin:0 0 24px;padding:16px;background:#f7f8fb;border-radius:8px;">${detailsHtml}</div>
                <p style="margin:0 0 24px;">
                  <a href="${safe(actionUrl)}" style="display:inline-block;background:#176b87;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:700;">${safe(actionLabel)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    });
  }

  private formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "full" });
  }

  private formatMinutes(minutes: number) {
    if (minutes >= 1440 && minutes % 1440 === 0) {
      const days = minutes / 1440;
      return days === 1 ? "1 jour" : `${days} jours`;
    }
    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60;
      return hours === 1 ? "1 heure" : `${hours} heures`;
    }
    return `${minutes} minutes`;
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
