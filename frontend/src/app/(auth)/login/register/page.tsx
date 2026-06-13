import { redirect } from "next/navigation";

export default function PatientRegisterPage() {
  redirect("/login?tab=register");
}
