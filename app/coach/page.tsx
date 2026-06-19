import { AuthGate } from "@/features/auth/components/auth-gate";
import { CoachShell } from "@/features/coach/components/coach-shell";

export default function CoachPage() {
  return (
    <AuthGate allowedRoles={["team", "coach"]} loginHref="/coach-login">
      <CoachShell />
    </AuthGate>
  );
}
