import DashboardClient from "../app/dashboard-client";

export default function DemoPage() {
  return <DashboardClient mode="demo" initialUser={{ name: "Gabriel", email: "demo@honora.pe" }} />;
}
