import { signIn } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const metadata = {
  title: "Sign Up - AgentMesh",
};

export default function SignupPage() {
  return (
    <AuthShell
      pageLabel="Create workspace access"
      title="Provision your first run."
      description="There was no signup surface before. This route now matches the landing and dashboard direction so the full product feels designed as one system."
      cardLabel="Sign up"
      cardTitle="Create your AgentMesh account"
      cardDescription="Account creation is provisioned through Google on first sign-in, then you land in the same Mission Control flow."
      alternateText="Already have access?"
      alternateHref="/login"
      alternateLabel="Sign in instead"
    >
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}
        className="space-y-4"
      >
        <GoogleAuthButton label="Create account with Google" />
        <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          Use the same Google identity your team already trusts. The first successful auth provisions the account.
        </div>
      </form>
    </AuthShell>
  );
}
