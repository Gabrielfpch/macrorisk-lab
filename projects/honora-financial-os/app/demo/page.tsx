import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "../app/dashboard-client";
import { DEMO_COOKIE_NAME, DEMO_SESSION_TOKEN } from "../../lib/demo-auth";

export default async function DemoPage() {
  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE_NAME)?.value !== DEMO_SESSION_TOKEN) redirect("/demo/login");
  return <DashboardClient mode="demo" initialUser={{ name: "Gabriel", email: "demo@honora.pe" }} />;
}
