import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";

const DEFAULT_SETTINGS = {
  companyName: "Tigilabs",
  ownerName: "Direction Tigilabs",
  contactEmail: "contact@tigilabs.com",
  contactPhone: "+237 600 000 000",
  privacyPolicy:
    "Tigilabs collecte uniquement les informations necessaires au traitement de vos demandes de contact (nom, email, message). Ces donnees ne sont jamais cedees a des tiers et sont conservees le temps necessaire au traitement de votre demande. Vous pouvez demander leur suppression a tout moment en nous contactant.",
};

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate() {
    const existing = await this.prisma.siteSettings.findFirst();
    if (existing) {
      return existing;
    }

    return this.prisma.siteSettings.create({ data: DEFAULT_SETTINGS });
  }

  async update(dto: UpdateSiteSettingsDto) {
    const existing = await this.findOrCreate();

    return this.prisma.siteSettings.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}
