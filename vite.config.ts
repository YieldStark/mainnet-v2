import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  // ClientOnlyApp in root.tsx SSR-renders only "Loading…" and skips the route
  // tree, so Vite cannot crawl dashboard deps from the first HTML. Include the
  // first-paint graph here so it is prebundled when `npm run dev` starts.
  optimizeDeps: {
    holdUntilCrawlEnd: false,
    // Do not prebundle the CDN loader — Vite's optimizer breaks Module Federation.
    exclude: [
      "@layerswap/widget-js",
      "@module-federation/runtime",
    ],
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router",
      "react-hot-toast",
      "framer-motion",
      "lucide-react",
      "zustand",
      "zustand/middleware",
      "zustand/vanilla",
      "starknet",
      "@starknet-react/core",
      "@starknet-react/chains",
      "@starknet-io/get-starknet",
      "@tanstack/react-query",
      "recharts",
      "@avnu/avnu-sdk",
    ],
  },
  server: {
    warmup: {
      clientFiles: [
        "./app/root.tsx",
        "./app/routes/home.tsx",
        "./app/routes/dashboard-layout.tsx",
        "./app/routes/dashboard.index.tsx",
        "./app/routes/dashboard.yield.tsx",
        "./app/routes/swap.tsx",
        "./app/components/layout/Layout.tsx",
        "./app/components/layout/Header.tsx",
        "./app/components/layout/Sidebar.tsx",
        "./app/providers/starknet-provider.tsx",
        "./app/lib/services/strk20.ts",
      ],
    },
  },
});
