import { AuthGate } from "@/features/auth/components/auth-gate";
import { CoachShell } from "@/features/coach/components/coach-shell";

export default function CoachPage() {
  return (
    <AuthGate allowedRoles={["team"]} loginHref="/team-login">
      <CoachShell />
    </AuthGate>
  );
}
