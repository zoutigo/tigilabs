import { SettingsRepository } from "./settings.repository";
import { SettingsService } from "./settings.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";

const repository = {
  findOrCreate: jest.fn(),
  update: jest.fn(),
};

const fullSettings = {
  id: "settings-1",
  companyName: "Tigilabs",
  ownerName: "Jane Doe",
  contactEmail: "jane@tigilabs.com",
  contactPhone: "+237600000000",
  address: "Douala",
  privacyPolicy: "Politique de confidentialite detaillee.",
  updatedAt: new Date("2026-01-01"),
};

describe("SettingsService", () => {
  let service: SettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SettingsService(repository as unknown as SettingsRepository);
  });

  it("returns only the public-safe fields", async () => {
    repository.findOrCreate.mockResolvedValue(fullSettings);

    await expect(service.findPublic()).resolves.toEqual({
      companyName: "Tigilabs",
      ownerName: "Jane Doe",
      contactEmail: "jane@tigilabs.com",
      contactPhone: "+237600000000",
      address: "Douala",
      privacyPolicy: "Politique de confidentialite detaillee.",
    });
  });

  it("returns the full settings record for admin consumption", async () => {
    repository.findOrCreate.mockResolvedValue(fullSettings);

    await expect(service.findAll()).resolves.toEqual(fullSettings);
  });

  it("delegates updates to the repository", async () => {
    const dto: UpdateSiteSettingsDto = {
      companyName: "Tigilabs",
      ownerName: "Jane Doe",
      contactEmail: "jane@tigilabs.com",
      contactPhone: "+237600000000",
      privacyPolicy: "Politique de confidentialite detaillee mise a jour.",
    };
    repository.update.mockResolvedValue({ ...fullSettings, ...dto });

    await service.update(dto);

    expect(repository.update).toHaveBeenCalledWith(dto);
  });
});
