import { Outlet } from "react-router";
import Layout from "~/components/layout/Layout";

export default function DocsLayout() {
  return (
    <Layout showSidebar={true}>
      <div className="space-y-6">
        <div className="bg-[#101D22] rounded-4xl p-6">
          <h1 className="text-3xl font-medium text-white">Docs</h1>
          <p className="text-gray-400">Documentation and guides</p>
        </div>
      </div>
    </Layout>
  );
}
