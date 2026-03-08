import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/rpc", "routes/api.rpc.ts"),
  route("api/swap", "routes/api.swap.ts"),
  route("api/deposit", "routes/api.deposit.ts"),
  route("api/stats", "routes/api.stats.ts"),
  route("api/test-db", "routes/api.test-db.ts"),
  route("api/check-data", "routes/api.check-data.ts"),
  route("dashboard", "routes/dashboard-layout.tsx", [
    index("routes/dashboard.index.tsx"),
    route("yield", "routes/dashboard.yield.tsx"),
    route("history", "routes/dashboard.history.tsx"),
    route("settings", "routes/dashboard.settings.tsx"),
    route("staking", "routes/dashboard.staking.tsx"),
    route("agent", "routes/dashboard.agent.tsx"),
  ]),
  route("swap", "routes/swap.tsx"),
  route("docs", "routes/docs.tsx"),
  route("support", "routes/support.tsx"),
] satisfies RouteConfig;
