import type { SiteSettings } from "@tigilabs/types";
import type { SiteSettingsInput } from "@tigilabs/schemas";
import { apiClient } from "./client";

export function getPublicSiteSettings() {
  return apiClient<SiteSettings>("/settings/public");
}

export function getSiteSettings() {
  return apiClient<SiteSettings>("/settings");
}

export function updateSiteSettings(payload: SiteSettingsInput) {
  return apiClient<SiteSettings>("/settings", {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}
