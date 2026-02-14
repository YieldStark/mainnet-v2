// Vesu V2 Pool and vToken ABI
// vTokens follow ERC-4626 standard + Pool interaction methods

export const VESU_POOL_ABI = [
  {
    type: "function",
    name: "manage_position",
    inputs: [
      {
        name: "params",
        type: "ModifyPositionParams",
      },
    ],
    outputs: [
      {
        type: "PositionState",
      },
    ],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "modify_delegation",
    inputs: [
      { name: "delegatee", type: "core::starknet::contract_address::ContractAddress" },
      { name: "delegated", type: "core::bool" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "asset_config",
    inputs: [
      { name: "asset", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [
      { type: "AssetConfig" },
    ],
    state_mutability: "view",
  },
] as const;

// ERC-4626 vToken ABI for Vesu V2
export const VESU_VTOKEN_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "assets", type: "core::integer::u256" },
      { name: "receiver", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "assets", type: "core::integer::u256" },
      { name: "receiver", type: "core::starknet::contract_address::ContractAddress" },
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "redeem",
    inputs: [
      { name: "shares", type: "core::integer::u256" },
      { name: "receiver", type: "core::starknet::contract_address::ContractAddress" },
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "shares", type: "core::integer::u256" },
      { name: "receiver", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "total_assets",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "convert_to_assets",
    inputs: [{ name: "shares", type: "core::integer::u256" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "convert_to_shares",
    inputs: [{ name: "assets", type: "core::integer::u256" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "max_deposit",
    inputs: [{ name: "receiver", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "max_withdraw",
    inputs: [{ name: "owner", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "balance_of",
    inputs: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "total_supply",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;
