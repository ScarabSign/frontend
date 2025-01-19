import { useEffect } from 'react';
import { useWS } from '../WSProvider';

const AUCTION_CHANNEL = 'auctions';

export const AuctionSubscription = () => {
  const { subscribe, unsubscribe } = useWS();

  useEffect(() => {
    const handleAuctionMessage = (message: string) => {
      try {
        const auctionData = JSON.parse(message);
        console.log('Received auction data:', auctionData);
        // Add any additional handling of auction messages here
      } catch (error) {
        console.error('Error parsing auction message:', error);
      }
    };

    // Subscribe to auction channel when component mounts
    subscribe(AUCTION_CHANNEL, handleAuctionMessage);

    // Cleanup subscription when component unmounts
    return () => {
      unsubscribe(AUCTION_CHANNEL);
    };
  }, [subscribe, unsubscribe]);

  // This is a side-effect only component, so return null
  return null;
};

// Export the channel name for reuse
export const getAuctionChannel = () => AUCTION_CHANNEL;
