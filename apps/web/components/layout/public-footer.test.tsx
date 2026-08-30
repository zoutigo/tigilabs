import { render, screen } from "@testing-library/react";
import type { SiteSettings } from "@tigilabs/types";
import { describe, expect, it } from "vitest";
import { PublicFooter } from "./public-footer";

const settings: SiteSettings = {
  companyName: "Tigilabs",
  ownerName: "Jane Doe",
  contactEmail: "jane@tigilabs.com",
  contactPhone: "+237 600 000 000",
  address: "Douala, Cameroun",
  privacyPolicy: "Politique de confidentialite.",
};

describe("PublicFooter", () => {
  it("renders contact information from the site settings", () => {
    render(<PublicFooter settings={settings} />);

    expect(screen.getByText("jane@tigilabs.com")).toBeInTheDocument();
    expect(screen.getByText("+237 600 000 000")).toBeInTheDocument();
    expect(screen.getByText("Douala, Cameroun")).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
  });

  it("links to the privacy policy page", () => {
    render(<PublicFooter settings={settings} />);

    expect(
      screen.getByRole("link", { name: "Politique de confidentialite" }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("shows the current year and company name in the copyright line", () => {
    render(<PublicFooter settings={settings} />);

    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    expect(screen.getByText(/Tigilabs/)).toBeInTheDocument();
  });
});
