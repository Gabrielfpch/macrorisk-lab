import { notFound } from "next/navigation";
import { getPublicIntake } from "../../../lib/server-store";
import IntakeForm from "./intake-form";

export const dynamic = "force-dynamic";

export default async function IntakePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const intake = await getPublicIntake(slug);
  if (!intake) notFound();
  return <IntakeForm slug={slug} businessName={intake.businessName} />;
}
