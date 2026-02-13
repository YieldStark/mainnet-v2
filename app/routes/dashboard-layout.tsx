import { Outlet } from "react-router";
import Layout from "~/components/layout/Layout";

export default function DashboardLayout() {
  return (
    <Layout showSidebar={true}>
      <Outlet />
    </Layout>
  );
}
