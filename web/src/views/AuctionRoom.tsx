import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useWS } from '../WSProvider';
import { useAccount } from "@starknet-react/core";
import { BidList } from '../components/BidList';
import { AuthorizeBid } from '../components/AuthorizeBid';
import { AuctionDetails } from '../components/AuctionDetails';
import { ConsumeAuction } from '../components/ConsumeAuction';
import { formatStarknetSignature } from '../utils';

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

interface AuctionRoomProps {}

export const AuctionRoom: React.FC<AuctionRoomProps> = () => {
  const { auctionSigHash } = useParams();
  const location = useLocation();
  const { address } = useAccount();
  const { subscribe, unsubscribe, sendMessage, isConnected } = useWS();
  
  const [auctionParams, setAuctionParams] = useState<AuctionParameters | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    const params = location.state?.auctionParams;
    if (params) {
      setAuctionParams(params);
    }
  }, [location]);

  useEffect(() => {
    if (!auctionSigHash) return;

    const auctionRoomChannel = `auctions/${auctionSigHash}`;

    const handleBidMessage = (message: string) => {
      try {
        const bidData = JSON.parse(message);
        if (bidData.type === 'bid_auth') {
          console.log('Received bid data:', bidData);
          if (Array.isArray(bidData.hash)) {
            bidData.data.signature = formatStarknetSignature(bidData.hash);
          }
          setBids(prev => [...prev, bidData]);
        }
      } catch (error) {
        console.error('Error parsing bid message:', error);
      }
    };

    const handleLocalBid = (event: CustomEvent) => {
      const bidData = event.detail;
      console.log('Local bid created:', bidData);
      setBids(prev => [...prev, bidData]);
    };

    // Subscribe to the auction room
    subscribe(auctionRoomChannel, handleBidMessage);

    // Send join room message
    sendMessage(auctionRoomChannel, JSON.stringify({
      type: 'join_room',
      auction_hash: auctionSigHash
    }));

    // Subscribe to local events
    window.addEventListener('newBid', handleLocalBid as EventListener);
    
    const handleNewAuction = (event: CustomEvent) => {
      const auctionData = event.detail;
      if (auctionData?.data?.message) {
        setAuctionParams(auctionData.data.message);
      }
    };

    window.addEventListener('newAuction', handleNewAuction as EventListener);

    return () => {
      window.removeEventListener('newAuction', handleNewAuction as EventListener);
      window.removeEventListener('newBid', handleLocalBid as EventListener);
      unsubscribe(auctionRoomChannel);
    }
  }, [auctionSigHash, subscribe, unsubscribe, sendMessage]);

  if (!isConnected) {
    return <div>Connecting to auction service...</div>;
  }

  if (!auctionSigHash) {
    return <div>Invalid auction room</div>;
  }

  if (!auctionParams) {
    return <div>Loading auction details...</div>;
  }

  return (
    <div>
      <h2>Auction Room</h2>
      <AuctionDetails 
        auctionParams={auctionParams} 
        auctionHash={auctionSigHash} 
      />
      {address?.toLowerCase() === auctionParams.auctioneer.toLowerCase() 
        ? <ConsumeAuction auction={{ 
            signature: auctionSigHash,
            data: { message: auctionParams }
          }} bids={bids} />
        : <AuthorizeBid />
      }
      <BidList bids={bids} />
    </div>
  );
};
