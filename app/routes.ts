import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
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
