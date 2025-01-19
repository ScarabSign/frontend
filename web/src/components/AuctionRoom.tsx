import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWS } from '../WSProvider';

interface AuctionRoomProps {}

export const AuctionRoom: React.FC<AuctionRoomProps> = () => {
  const { auctionSigHash } = useParams();
  const { subscribe, unsubscribe, sendMessage, isConnected } = useWS();

  useEffect(() => {
    if (!auctionSigHash) return;

    const auctionRoomChannel = `auctions/${auctionSigHash}`;

    const handleAuctionRoomMessage = (message: string) => {
      try {
        const roomMessage = JSON.parse(message);
        console.log('Auction Room Message:', roomMessage);
        // Handle room-specific messages here
      } catch (error) {
        console.error('Error parsing auction room message:', error);
      }
    };

    // Subscribe to the auction room
    subscribe(auctionRoomChannel, handleAuctionRoomMessage);

    // Send join room message
    sendMessage(auctionRoomChannel, JSON.stringify({
      type: 'join_room',
      auction_hash: auctionSigHash
    }));

    // Cleanup subscription on unmount
    return () => unsubscribe(auctionRoomChannel);
  }, [auctionSigHash, subscribe, unsubscribe, sendMessage]);

  if (!isConnected) {
    return <div>Connecting to auction service...</div>;
  }

  if (!auctionSigHash) {
    return <div>Invalid auction room</div>;
  }

  return (
    <div>
      <h2>Auction Room</h2>
      <p>Auction Hash: {auctionSigHash}</p>
      {/* Add auction room specific UI elements here */}
    </div>
  );
};
