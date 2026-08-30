import { Injectable } from "@nestjs/common";
import { SettingsRepository } from "./settings.repository";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";

const PUBLIC_FIELDS = [
  "companyName",
  "ownerName",
  "contactEmail",
  "contactPhone",
  "address",
  "privacyPolicy",
] as const;

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async findPublic() {
    const settings = await this.settingsRepository.findOrCreate();
    return Object.fromEntries(
      PUBLIC_FIELDS.map((field) => [field, settings[field]]),
    ) as Pick<typeof settings, (typeof PUBLIC_FIELDS)[number]>;
  }

  findAll() {
    return this.settingsRepository.findOrCreate();
  }

  update(dto: UpdateSiteSettingsDto) {
    return this.settingsRepository.update(dto);
  }
}
