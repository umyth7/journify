import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import RegisterPage from "@/app/(auth)/register/page";

// ── Hoisted mock refs ─────────────────────────────────────────────────────────
const { mockSignUpCreate, mockSetActive, mockRouterPush } = vi.hoisted(() => ({
  mockSignUpCreate: vi.fn(),
  mockSetActive: vi.fn(),
  mockRouterPush: vi.fn(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock("@clerk/nextjs", () => ({
  useSignUp: () => ({
    signUp: { create: mockSignUpCreate },
    setActive: mockSetActive,
    isLoaded: true,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
// getByText finds the inner <span> with the exact label, .closest("button") goes up to the role button
const artistBtn = () => screen.getByText("Artist").closest("button") as HTMLButtonElement;
const listenerBtn = () => screen.getByText("Listener").closest("button") as HTMLButtonElement;

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("RegisterPage", () => {
  // delay: null speeds up key simulation, preventing flakiness
  const user = userEvent.setup({ delay: null });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders username, email, password fields and submit button", () => {
    const { container } = render(<RegisterPage />);

    expect(container.querySelector("#username")).toBeInTheDocument();
    expect(container.querySelector("#email")).toBeInTheDocument();
    expect(container.querySelector("#password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows Artist and Listener role buttons, with Listener selected by default", () => {
    render(<RegisterPage />);

    expect(artistBtn()).toHaveAttribute("aria-pressed", "false");
    expect(listenerBtn()).toHaveAttribute("aria-pressed", "true");
  });

  it("switches role to Artist when Artist button is clicked", async () => {
    render(<RegisterPage />);

    await user.click(artistBtn());

    expect(artistBtn()).toHaveAttribute("aria-pressed", "true");
    expect(listenerBtn()).toHaveAttribute("aria-pressed", "false");
  });

  it("switches back to Listener when Listener button is clicked after Artist", async () => {
    render(<RegisterPage />);

    await user.click(artistBtn());
    expect(artistBtn()).toHaveAttribute("aria-pressed", "true");

    await user.click(listenerBtn());
    expect(listenerBtn()).toHaveAttribute("aria-pressed", "true");
    expect(artistBtn()).toHaveAttribute("aria-pressed", "false");
  });

  it("switches all labels to Turkish when TR is clicked", async () => {
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: "TR" }));

    // heading and button both say "Hesap oluştur" in TR — target each by role
    expect(screen.getByRole("heading", { name: /hesap oluştur/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^hesap oluştur$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/kullanıcı adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument();
    expect(screen.getByText(/ben bir/i)).toBeInTheDocument();
  });

  it("toggles password visibility with the eye button", async () => {
    const { container } = render(<RegisterPage />);

    const input = container.querySelector("#password") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByLabelText("Show password"));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByLabelText("Hide password"));
    expect(input).toHaveAttribute("type", "password");
  });

  it("calls signUp.create with correct params including role in unsafeMetadata", async () => {
    mockSignUpCreate.mockResolvedValueOnce({
      status: "complete",
      createdSessionId: "sess_new",
    });

    const { container } = render(<RegisterPage />);
    await user.click(artistBtn());

    await user.type(container.querySelector("#username")!, "djsolar");
    await user.type(container.querySelector("#email")!, "dj@example.com");
    await user.type(container.querySelector("#password")!, "secure123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(
      () =>
        expect(mockSignUpCreate).toHaveBeenCalledWith({
          username: "djsolar",
          emailAddress: "dj@example.com",
          password: "secure123",
          unsafeMetadata: { role: "artist" },
        }),
      { timeout: 3000 }
    );
  });

  it("passes 'listener' role when no role change was made", async () => {
    mockSignUpCreate.mockResolvedValueOnce({
      status: "complete",
      createdSessionId: "sess_listener",
    });

    const { container } = render(<RegisterPage />);
    await user.type(container.querySelector("#username")!, "audiofan");
    await user.type(container.querySelector("#email")!, "fan@example.com");
    await user.type(container.querySelector("#password")!, "listen123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(
      () =>
        expect(mockSignUpCreate).toHaveBeenCalledWith(
          expect.objectContaining({ unsafeMetadata: { role: "listener" } })
        ),
      { timeout: 3000 }
    );
  });

  it("calls setActive and redirects to / after successful registration", async () => {
    mockSignUpCreate.mockResolvedValueOnce({
      status: "complete",
      createdSessionId: "sess_ok",
    });

    const { container } = render(<RegisterPage />);
    await user.type(container.querySelector("#username")!, "newuser");
    await user.type(container.querySelector("#email")!, "new@example.com");
    await user.type(container.querySelector("#password")!, "newpass1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(
      () => expect(mockSetActive).toHaveBeenCalledWith({ session: "sess_ok" }),
      { timeout: 3000 }
    );
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/"), { timeout: 3000 });
  });

  it("shows Clerk error message when registration fails", async () => {
    mockSignUpCreate.mockRejectedValueOnce({
      errors: [{ longMessage: "That username is already taken." }],
    });

    const { container } = render(<RegisterPage />);
    await user.type(container.querySelector("#username")!, "taken");
    await user.type(container.querySelector("#email")!, "x@x.com");
    await user.type(container.querySelector("#password")!, "pass1234");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(
      () => expect(screen.getByRole("alert")).toHaveTextContent("That username is already taken."),
      { timeout: 3000 }
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("shows generic fallback error when Clerk provides no message", async () => {
    mockSignUpCreate.mockRejectedValueOnce({});

    const { container } = render(<RegisterPage />);
    await user.type(container.querySelector("#username")!, "u");
    await user.type(container.querySelector("#email")!, "u@u.com");
    await user.type(container.querySelector("#password")!, "p");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(
      () =>
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Sign up failed. Please try again."
        ),
      { timeout: 3000 }
    );
  });

  it("does not show error alert before any submission attempt", () => {
    render(<RegisterPage />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
