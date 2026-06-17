import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/facilitator?tab=admin");
}
