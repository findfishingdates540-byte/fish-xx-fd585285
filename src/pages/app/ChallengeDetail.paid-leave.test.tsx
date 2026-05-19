import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---- Mocks ----
const navigateMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ id: "ch-paid-1" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock("sonner", () => ({
  toast: { error: (...a: any[]) => toastErrorMock(...a), success: (...a: any[]) => toastSuccessMock(...a) },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/hooks/use-server-time", () => ({
  getServerTimeStatus: () => ({ status: "active", startMs: 0, endMs: Date.now() + 86400000 }),
}));
vi.mock("@/hooks/use-countdown", () => ({ useCountdown: () => "" }));
vi.mock("@/lib/config", () => ({ getShareBaseUrl: () => "https://example.test" }));
vi.mock("@/lib/format-rules", () => ({ FormattedRules: () => null }));

const PAID_CHALLENGE = {
  id: "ch-paid-1",
  title: "Paid Challenge",
  description: "Big money",
  entry_fee_enabled: true,
  prize_type: "cash",
  entry_fee: 25,
  start_date: "2026-01-01",
  end_date: "2026-12-31",
};

vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => {
    if (table === "fishing_challenges") {
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: PAID_CHALLENGE, error: null }) }) }),
      };
    }
    if (table === "challenge_participants") {
      const chain: any = {
        select: () => ({
          eq: () => ({ order: async () => ({ data: [{ user_id: "user-1", score: 0, challenge_id: "ch-paid-1" }], error: null }) }),
        }),
        delete: () => ({
          eq: () => ({
            eq: async () => {
              deleteMock();
              return { error: null };
            },
          }),
        }),
      };
      return chain;
    }
    if (table === "fishing_challenge_entries") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { has_paid: true }, error: null }) }),
          }),
        }),
      };
    }
    if (table === "profiles_safe") {
      return { select: () => ({ in: async () => ({ data: [], error: null }) }) };
    }
    return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
  };
  return { supabase: { from: builder, functions: { invoke: vi.fn() } } };
});

import ChallengeDetail from "./ChallengeDetail";

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ChallengeDetail />
    </QueryClientProvider>,
  );
};

describe("ChallengeDetail — paid challenge cannot be left", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    toastErrorMock.mockClear();
    toastSuccessMock.mockClear();
    deleteMock.mockClear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("blocks leave on paid entry, shows support toast, redirects to /help, and never deletes the participant row", async () => {
    renderPage();

    const leaveBtn = await screen.findByRole("button", { name: /leave challenge/i });
    fireEvent.click(leaveBtn);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(/redirecting you to support/i),
      );
    });
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/help\?topic=refund&challenge=ch-paid-1$/),
    );
    expect(deleteMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});