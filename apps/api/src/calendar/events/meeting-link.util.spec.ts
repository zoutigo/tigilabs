import { generateMeetingUrl } from "./meeting-link.util";

describe("generateMeetingUrl", () => {
  it("slugifies the event title into the Jitsi room name", () => {
    const url = generateMeetingUrl("Reunion equipe developpement");
    expect(url).toMatch(
      /^https:\/\/meet\.jit\.si\/tigilabs-reunion-equipe-developpement-[0-9a-f]{8}$/,
    );
  });

  it("strips accents and special characters", () => {
    const url = generateMeetingUrl("Présentation École Sainte-Marie !");
    expect(url).toMatch(
      /^https:\/\/meet\.jit\.si\/tigilabs-presentation-ecole-sainte-marie-[0-9a-f]{8}$/,
    );
  });

  it("falls back to a generic slug for an empty/symbol-only title", () => {
    const url = generateMeetingUrl("!!!");
    expect(url).toMatch(/^https:\/\/meet\.jit\.si\/tigilabs-rdv-[0-9a-f]{8}$/);
  });

  it("generates a different suffix on each call", () => {
    const first = generateMeetingUrl("Point hebdo");
    const second = generateMeetingUrl("Point hebdo");
    expect(first).not.toBe(second);
  });
});
