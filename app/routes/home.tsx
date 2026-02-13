import { Navigate } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "YieldStark - DeFi Yield Optimization on Starknet" },
    {
      name: "description",
      content: "Optimize your DeFi yields with YieldStark's intelligent agent on Starknet",
    },
  ];
}

export default function Home() {
  return <Navigate to="/dashboard" replace />;
}
