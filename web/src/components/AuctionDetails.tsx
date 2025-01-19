import React from 'react';

interface AuctionParameters {
  auctioneer: string;
  nft: {
    collection_address: string;
    nft_id: number;
  };
  min_bid: {
    token_address: string;
    amount: number;
  };
  deadline: number;
  timestamp: number;
}

interface AuctionDetailsProps {
  auctionParams: AuctionParameters;
  auctionHash?: string;
}

export const AuctionDetails: React.FC<AuctionDetailsProps> = ({ auctionParams, auctionHash }) => {
  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDeadline = (deadline: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remainingSeconds = deadline - now;
    
    if (remainingSeconds <= 0) {
      return 'Expired';
    }

    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m remaining`;
  };

  return (
    <div>
      <h3>Auction Details</h3>
      {auctionHash && <p>Hash: {formatAddress(auctionHash)}</p>}
      <p>Auctioneer: {formatAddress(auctionParams.auctioneer)}</p>
      <p>Created: {formatTimestamp(auctionParams.timestamp)}</p>
      <p>Status: {formatDeadline(auctionParams.deadline)}</p>
      
      <h3>NFT Details</h3>
      <p>Collection: {formatAddress(auctionParams.nft.collection_address)}</p>
      <p>Token ID: {auctionParams.nft.nft_id}</p>
      
      <h3>Bid Requirements</h3>
      <p>Minimum Bid: {auctionParams.min_bid.amount}</p>
      <p>Token Address: {formatAddress(auctionParams.min_bid.token_address)}</p>
    </div>
  );
};
