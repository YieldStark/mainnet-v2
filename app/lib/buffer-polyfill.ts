import { Buffer } from "buffer";

// The Layerswap widget's EVM/wallet stack (and its crypto deps) reference a bare
// `Buffer` global. Vite's dev server provides it via esbuild's injected shim, but
// the production Rollup build does not — so the bridge page crashed at runtime
// with "ReferenceError: Buffer is not defined". Define it on the client here,
// before any wallet code runs. On the server this is a no-op (Node has Buffer,
// and `buffer` resolves to the Node builtin there, not the browser polyfill).
if (
  typeof globalThis !== "undefined" &&
  typeof (globalThis as { Buffer?: unknown }).Buffer === "undefined"
) {
  (globalThis as { Buffer?: unknown }).Buffer = Buffer;
}
