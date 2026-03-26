import { signIn } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const metadata = {
  title: "Sign In - AgentMesh",
};

export default function LoginPage() {
  return (
    <AuthShell
      pageLabel="Access Mission Control"
      title="Step into the control room."
      description="Authenticate once, then move straight into the workflow surface. The auth screens now share the same cinematic product language as the rest of the app."
      cardLabel="Sign in"
      cardTitle="Continue with your workspace identity"
      cardDescription="Google is the only auth provider wired today, so the path is short and deliberate."
      alternateText="Need a first-time workspace entry?"
      alternateHref="/signup"
      alternateLabel="Create an account"
    >
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}
        className="space-y-4"
      >
        <GoogleAuthButton label="Continue with Google" />
        <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          Your first authenticated session drops you into Mission Control after Google returns.
        </div>
      </form>
    </AuthShell>
  );
}
