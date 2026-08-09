import { requireChatGPTUser } from "../chatgpt-auth";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const user = await requireChatGPTUser("/app");
  return <DashboardClient mode="live" initialUser={{ name: user.displayName, email: user.email }} />;
}
