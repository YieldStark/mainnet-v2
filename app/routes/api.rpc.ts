import { data } from "react-router";
import type { Route } from "./+types/api.rpc";

/**
 * Server-side proxy for Starknet RPC calls
 * Bypasses CORS restrictions by making calls from the server
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { rpcUrl, payload } = await request.json();

    if (!rpcUrl || !payload) {
      return data({ error: "Missing rpcUrl or payload" }, { status: 400 });
    }

    // Make the RPC call from the server (no CORS issues)
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return data(result);
  } catch (error) {
    console.error("RPC proxy error:", error);
    return data(
      { error: "Failed to fetch from RPC endpoint" },
      { status: 500 }
    );
  }
}
