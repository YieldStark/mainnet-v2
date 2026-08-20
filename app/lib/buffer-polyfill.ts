import { Buffer } from "buffer";

// Layerswap's EVM/wallet stack expects a bare `Buffer` global. Import this
// only from the lazy bridge widget — never from root.tsx. A static import in
// root pulled node-stdlib-browser's CJS `buffer` into the dashboard graph and
// crashed ClientOnlyApp on "Loading…" with `require is not defined`.
const g = globalThis as { Buffer?: typeof Buffer };
if (typeof g.Buffer === "undefined") {
  g.Buffer = Buffer;
}
