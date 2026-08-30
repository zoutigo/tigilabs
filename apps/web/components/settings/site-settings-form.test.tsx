import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SiteSettings } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { SiteSettingsForm } from "./site-settings-form";

const apiMocks = vi.hoisted(() => ({
  updateSiteSettings: vi.fn(),
}));

const settings: SiteSettings = {
  companyName: "Tigilabs",
  ownerName: "Jane Doe",
  contactEmail: "jane@tigilabs.com",
  contactPhone: "+237600000000",
  address: "Douala",
  privacyPolicy: "Politique de confidentialite detaillee et complete.",
};

vi.mock("../../hooks/use-site-settings", () => ({
  useSiteSettings: () => ({ settings }),
}));

vi.mock("../../lib/api/settings", () => apiMocks);

function renderForm() {
  return render(
    <ToastProvider>
      <SiteSettingsForm />
    </ToastProvider>,
  );
}

describe("SiteSettingsForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills the form with the current settings", () => {
    renderForm();

    expect(screen.getByLabelText("Nom de l'entreprise")).toHaveValue(
      "Tigilabs",
    );
    expect(screen.getByLabelText("Nom du responsable")).toHaveValue("Jane Doe");
    expect(screen.getByLabelText("Email de contact")).toHaveValue(
      "jane@tigilabs.com",
    );
  });

  it("submits the updated settings and shows a success toast", async () => {
    apiMocks.updateSiteSettings.mockResolvedValue(settings);
    renderForm();

    fireEvent.input(screen.getByLabelText("Nom du responsable"), {
      target: { value: "John Smith" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(apiMocks.updateSiteSettings).toHaveBeenCalledWith(
        expect.objectContaining({ ownerName: "John Smith" }),
      );
    });
    expect(
      await screen.findByText("Parametres du site mis a jour."),
    ).toBeInTheDocument();
  });

  it("shows an error toast when the update fails", async () => {
    apiMocks.updateSiteSettings.mockRejectedValue(
      new Error("Mise a jour impossible."),
    );
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    expect(
      await screen.findByText("Mise a jour impossible."),
    ).toBeInTheDocument();
  });
});
