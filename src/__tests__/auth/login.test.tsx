import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import LoginPage from "@/app/(auth)/login/page";

// ── Hoisted mock refs ─────────────────────────────────────────────────────────
const { mockSignInCreate, mockSetActive, mockRouterPush } = vi.hoisted(() => ({
  mockSignInCreate: vi.fn(),
  mockSetActive: vi.fn(),
  mockRouterPush: vi.fn(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock("@clerk/nextjs", () => ({
  useSignIn: () => ({
    signIn: { create: mockSignInCreate },
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

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("LoginPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input, password input and sign-in button", () => {
    const { container } = render(<LoginPage />);

    expect(container.querySelector("#email")).toBeInTheDocument();
    expect(container.querySelector("#password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows welcome heading and EN/TR toggle buttons on load", () => {
    render(<LoginPage />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TR" })).toBeInTheDocument();
  });

  it("switches UI to Turkish when TR is clicked", async () => {
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "TR" }));

    expect(screen.getByText("Tekrar hoş geldin")).toBeInTheDocument();
    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument();
    // Check password label by finding label element — avoids collision with "Şifreyi göster" aria-label
    expect(screen.getByText(/^şifre$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /giriş yap/i })).toBeInTheDocument();
  });

  it("toggles password visibility with the eye button", async () => {
    const { container } = render(<LoginPage />);

    const input = container.querySelector("#password") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByLabelText("Show password"));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByLabelText("Hide password"));
    expect(input).toHaveAttribute("type", "password");
  });

  it("calls signIn.create with identifier and password on submit", async () => {
    mockSignInCreate.mockResolvedValueOnce({
      status: "complete",
      createdSessionId: "sess_test123",
    });

    const { container } = render(<LoginPage />);
    await user.type(container.querySelector("#email")!, "dj@example.com");
    await user.type(container.querySelector("#password")!, "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockSignInCreate).toHaveBeenCalledWith({
      identifier: "dj@example.com",
      password: "secret123",
    });
  });

  it("calls setActive and redirects to / after successful login", async () => {
    mockSignInCreate.mockResolvedValueOnce({
      status: "complete",
      createdSessionId: "sess_test123",
    });

    const { container } = render(<LoginPage />);
    await user.type(container.querySelector("#email")!, "dj@example.com");
    await user.type(container.querySelector("#password")!, "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(mockSetActive).toHaveBeenCalledWith({ session: "sess_test123" })
    );
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/"));
  });

  it("shows Clerk error message when sign-in fails", async () => {
    mockSignInCreate.mockRejectedValueOnce({
      errors: [{ longMessage: "Email address or password is incorrect." }],
    });

    const { container } = render(<LoginPage />);
    await user.type(container.querySelector("#email")!, "wrong@example.com");
    await user.type(container.querySelector("#password")!, "badpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email address or password is incorrect."
      )
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("shows generic fallback error when Clerk provides no message", async () => {
    mockSignInCreate.mockRejectedValueOnce({});

    const { container } = render(<LoginPage />);
    await user.type(container.querySelector("#email")!, "x@x.com");
    await user.type(container.querySelector("#password")!, "x");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Sign in failed. Please try again."
      )
    );
  });

  it("does not show error alert before any submission attempt", () => {
    render(<LoginPage />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears previous error when a new submission starts", async () => {
    mockSignInCreate
      .mockRejectedValueOnce({ errors: [{ longMessage: "First error" }] })
      .mockResolvedValueOnce({ status: "complete", createdSessionId: "s" });

    const { container } = render(<LoginPage />);
    const submit = screen.getByRole("button", { name: /sign in/i });

    await user.type(container.querySelector("#email")!, "a@b.com");
    await user.type(container.querySelector("#password")!, "wrong");
    await user.click(submit);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    await user.click(submit);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
