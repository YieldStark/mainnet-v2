import { createRequire } from "node:module";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import nodeStdlibBrowser from "node-stdlib-browser";

const require = createRequire(import.meta.url);

/**
 * The Layerswap widget's EVM wallet stack (wagmi/viem/WalletConnect/ethers)
 * expects Node core modules (`stream`, `process`, `Buffer`, etc.) to exist in
 * the browser bundle. Node already provides these natively for SSR, so this
 * must only redirect *client* module resolution.
 *
 * We intentionally avoid `vite-plugin-node-polyfills` here: it wires its
 * aliases through the shared `resolve.alias` config, which Vite applies to
 * every environment (client AND ssr) regardless of the plugin's own hooks.
 * That hijacks React Router's server entry (`node:stream` -> the CJS
 * `stream-browserify`, which breaks under the ESM SSR module runner with
 * "module is not defined"). Resolving via a `resolveId` hook instead lets us
 * check `options.ssr` per call and leave server-side resolution untouched.
 */
function clientOnlyNodePolyfills(): Plugin {
  const polyfills = nodeStdlibBrowser as unknown as Record<string, string>;

  return {
    name: "client-only-node-polyfills",
    enforce: "pre",
    resolveId(source, importer, options) {
      if (options?.ssr) return null;
      const target = polyfills[source];
      if (!target) return null;
      return this.resolve(target, importer, { skipSelf: true });
    },
    config() {
      return {
        define: {
          // Safe for both environments: Node's `global` and `globalThis`
          // are interchangeable at runtime.
          global: "globalThis",
        },
        optimizeDeps: {
          // Only affects client dependency pre-bundling, not SSR.
          esbuildOptions: {
            define: { global: "globalThis" },
            inject: [require.resolve("node-stdlib-browser/helpers/esbuild/shim")],
          },
        },
      };
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), clientOnlyNodePolyfills()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
