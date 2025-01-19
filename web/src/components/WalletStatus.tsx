import { useConnect } from '@starknet-react/core'

import { useNetwork  } from "@starknet-react/core";
import { useAccount } from '@starknet-react/core'

const ConnectWallet = () => {
	const { connect, connectors } = useConnect()

	return (
		<div>
			{connectors.map((connector) => (
				<button 
					key={connector.id}
					onClick={() => connect({ connector })}
				>
					Connect {connector.name}
				</button>
			))}
		</div>
	)
}
export const WalletStatus = () => {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork();
  if (isConnected) {
    return (
      <div>
        <p>Connected to {address}</p>
        <p>On {chain.name}</p>
      </div>
    )
  }
  return (
    <div>
      <ConnectWallet />
    </div>
  )
}
