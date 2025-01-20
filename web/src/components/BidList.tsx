import '../table.css'
import React from 'react';
import { formatStarknetSignature } from '../utils';

interface Bid {
  hash: string[];
  data: {
    bidder: string;
    nonce: string;
    auction_sig_hash: string;
    bid: {
      token_address: string;
      amount: string;
    };
    timestamp: number;
    signature?: string;
  };
}

interface BidListProps {
  bids: Bid[];
}

export const BidList: React.FC<BidListProps> = ({ bids }) => {
  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
   <div className="data-table-container">
      <h2>Bids for Auction</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th className="time-column">Time</th>
            <th className="address-column">Bidder</th>
            <th className="number-column">Nonce</th>
            <th className="number-column">Bid Amount</th>
            <th className="address-column">Token</th>
            <th className="address-column">Signature</th>
          </tr>
        </thead>
        <tbody>
          {bids.map((bid, index) => (
            <tr key={`${bid.data.signature || bid.hash}-${index}`}>
              <td className="time-column">{formatTimestamp(bid.data.timestamp)}</td>
              <td className="address-column">{formatAddress(bid.data.bidder)}</td>
              <td className="number-column">{bid.data.nonce}</td>
              <td className="number-column">{bid.data.bid.amount}</td>
              <td className="address-column">{formatAddress(bid.data.bid.token_address)}</td>
              <td className="address-column">{formatAddress(bid.data.signature || (Array.isArray(bid.hash) ? formatStarknetSignature(bid.hash) : bid.hash))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
