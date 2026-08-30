"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@tigilabs/types";
import { getSiteSettings } from "../lib/api/settings";

const fallbackSettings: SiteSettings = {
  companyName: "Tigilabs",
  ownerName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  privacyPolicy: "",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);

  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .catch(() => setSettings(fallbackSettings));
  }, []);

  return { settings };
}
