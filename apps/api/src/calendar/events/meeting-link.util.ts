import { randomBytes } from "node:crypto";

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/**
 * Generates a ready-to-use videoconference link without any external API
 * key, using the public Jitsi Meet instance. Phase 3 "creation automatique
 * de visioconference" - works out of the box, unlike a Zoom/Meet/Teams
 * integration which would require registering an OAuth app with that
 * provider before it could be wired in.
 */
export function generateMeetingUrl(eventTitle: string) {
  const slug = eventTitle
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 40);

  const suffix = randomBytes(4).toString("hex");

  return `https://meet.jit.si/tigilabs-${slug || "rdv"}-${suffix}`;
}
