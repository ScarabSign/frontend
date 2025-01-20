import { useConnect, useNetwork, useAccount } from '@starknet-react/core'
import '../utility.css'

const ConnectWallet = () => {
  const { connect, connectors } = useConnect()

  return (
    <div className="wallet-status">
      {connectors.map((connector) => (
        <button 
          key={connector.id}
          onClick={() => connect({ connector })}
          className="connect-button"
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
  
  if (isConnected && address) {
    return (
      <div className="wallet-status">
        <div className="wallet-badge">
          <span className="chain-name">{chain.name}</span>
          <span className="wallet-address">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
      </div>
    )
  }

  return <ConnectWallet />
}
