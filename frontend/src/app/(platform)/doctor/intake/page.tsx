import { redirect } from "next/navigation";

/** Legacy route — triage summaries live on appointment details now. */
export default function DoctorIntakePage() {
  redirect("/appointments");
}
