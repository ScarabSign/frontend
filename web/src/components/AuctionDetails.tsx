import React from 'react';
import "../details.css"	
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
  const deadline = formatDeadline(auctionParams.deadline);

  return (
<div className="details-container">
      <div className="details-group">
        <h3>Auction Info</h3>
        {auctionHash && (
          <div className="details-row">
            <span className="details-label">Hash</span>
            <span className="details-value hash-value">{formatAddress(auctionHash)}</span>
          </div>
        )}
        <div className="details-row">
          <span className="details-label">Auctioneer</span>
          <span className="details-value address-value">{formatAddress(auctionParams.auctioneer)}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Created</span>
          <span className="details-value">{formatTimestamp(auctionParams.timestamp)}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Status</span>
          <span className={`status-badge ${deadline.isExpired ? 'status-expired' : 'status-active'}`}>
            {deadline.text}
          </span>
        </div>
      </div>

      <div className="details-group">
        <h3>NFT Details</h3>
        <div className="details-row">
          <span className="details-label">Collection</span>
          <span className="details-value address-value">
            {formatAddress(auctionParams.nft.collection_address)}
          </span>
        </div>
        <div className="details-row">
          <span className="details-label">Token ID</span>
          <span className="details-value">{auctionParams.nft.nft_id}</span>
        </div>
      </div>

      <div className="details-group">
        <h3>Bid Requirements</h3>
        <div className="details-row">
          <span className="details-label">Minimum Bid</span>
          <span className="details-value">{auctionParams.min_bid.amount}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Token Address</span>
          <span className="details-value address-value">
            {formatAddress(auctionParams.min_bid.token_address)}
          </span>
        </div>
      </div>
    </div>
  );
};
