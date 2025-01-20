import ERC20 from '../assets/abi/MockERC20.json'
import ERC721 from '../assets/abi/MockERC721.json'
import { useReadContract, useAccount } from '@starknet-react/core'
import '../utility.css'

export const ERC20Balance = () => {
  const { address, isConnected } = useAccount()
  
  const { data, error, isLoading } = useReadContract({
    abi: ERC20.abi,
    address: ERC20.address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true
  })

  if (!isConnected) return null;

  if (isLoading) {
    return <span className="loading-text">Loading...</span>
  }

  if (error) {
    return <span className="error-text">Error: {error.message}</span>
  }

  return (
    <div className="balance-badge">
      <span className="balance-label">ERC20</span>
      <span className="balance-value">{data?.toString() || '0'}</span>
    </div>
  )
}

export const ERC721Balance = () => {
  const { address, isConnected } = useAccount()
  
  const { data: balanceData, error: balanceError, isLoading: balanceIsLoading } = useReadContract({
    abi: ERC721.abi,
    address: ERC721.address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true 
  })

  if (!isConnected) return null;

  if (balanceIsLoading) {
    return <span className="loading-text">Loading...</span>
  }

  if (balanceError) {
    return <span className="error-text">Error: {balanceError.message}</span>
  }

  return (
    <div className="balance-badge">
      <span className="balance-label">NFTs</span>
      <span className="balance-value">{balanceData?.toString() || '0'}</span>
    </div>
  )
}

export const Balances = () => {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return null;
  }

  return (
    <div className="balances-container">
      <ERC20Balance />
      <ERC721Balance />
    </div>
  )
}
