import ERC20 from '../assets/abi/MockERC20.json'
import ERC721 from '../assets/abi/MockERC721.json'

import { useReadContract } from '@starknet-react/core'
import { useAccount } from '@starknet-react/core'

export const ERC20Balance = () => {
  const { address, isConnected } = useAccount()
  
  // Only call useReadContract when we have an address
  const { data, error, isLoading } = useReadContract({
    abi: ERC20.abi,
    address: ERC20.address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined, // Only pass args when address exists
    watch: true // Optional: to keep balance updated
  })

  if (!isConnected) {
    return <p>Please Connect Wallet to view Balances</p>
  }

  if (isLoading) {
    return <p>Loading balances...</p>
  }

  if (error) {
    return <p>Error loading balance: {error.message}</p>
  }

  return (
    <div>
      <p>ERC20: {data?.toString() || '0'}</p>
</div>
  )
}

export const ERC721Balance = () => {
  const { address, isConnected } = useAccount()
  
  // Only call useReadContract when we have an address
  const { data:balanceData, error:balanceError, isLoading:balanceIsLoading } = useReadContract({
    abi: ERC721.abi,
    address: ERC721.address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined, // Only pass args when address exists
    watch: true 
  })
  const { data:ownerData, error:ownerError, isLoading:ownerIsLoading } = useReadContract({
    abi: ERC721.abi,
    address: ERC721.address,
    functionName: 'ownerOf',
    args: [0], // Only pass args when address exists
    watch: true 
  })



  if (!isConnected) {
    return <p>Please Connect Wallet to view Balances</p>
  }

  if (balanceIsLoading || ownerIsLoading) {
    return <p>Loading balances...</p>
  }

  if (balanceError && ownerError) {
    return <p>Error loading balance: {balanceError.message} {ownerError.message}</p>
  }

  return (
    <div>
      <p>ERC721- Nfts Owned: { balanceData?.toString() || '0'}</p>
      <p>ERC721- Owns NFT 0: {
        address.toLowerCase() === '0x' + ownerData?.toString(16).padStart(64, '0') ? 'true' : 'false'
      }</p>
  </div>
  )
}

export const Balances = () => {
  return (
    <div>
      <ERC20Balance />
      <ERC721Balance />
    </div>
  )
}
