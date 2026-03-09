import { Outlet } from "react-router";
import Layout from "~/components/layout/Layout";

export default function SupportLayout() {
  return (
    <Layout showSidebar={true}>
      <div className="space-y-6">
        <div className="bg-[#101D22] rounded-4xl p-6">
          <h1 className="text-3xl font-medium text-white mb-2">Support</h1>
          <p className="text-gray-400 mb-6">Get help and contact us</p>

          <p className="text-white font-medium mb-4">For questions and support:</p>
          <ul className="space-y-3 text-gray-300">
            <li>
              <span className="text-gray-400">Join Telegram community:</span>{" "}
              <a
                href="https://t.me/+ZTV7qYFfdU43NTU0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#97FCE4] hover:underline"
              >
                https://t.me/+ZTV7qYFfdU43NTU0
              </a>
            </li>
            <li>
              <span className="text-gray-400">Follow on X:</span>{" "}
              <a
                href="https://x.com/YieldStark"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#97FCE4] hover:underline"
              >
                https://x.com/YieldStark
              </a>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
