import { RpcProvider, type RpcProviderOptions } from 'starknet'
import { RPC_PROVIDERS } from '~/lib/config'

/**
 * starknet.js 10 dropped RPC 0.8.x channels. @starknet-react/core's
 * publicProvider() still passes specVersion "0.8.1", which throws
 * "unsupported channel for spec version: 0.8.1" and loops the error boundary.
 */
export const RPC_SPEC_VERSION = '0.9.0' as const

export function rpcProviderOptions(
  nodeUrl: string = RPC_PROVIDERS.LAVA
): RpcProviderOptions {
  return {
    nodeUrl,
    specVersion: RPC_SPEC_VERSION,
  }
}

export function createRpcProvider(nodeUrl: string): RpcProvider {
  return new RpcProvider(rpcProviderOptions(nodeUrl))
}
