import '../table.css'
import React, { useState, useEffect } from 'react';
import { useWS } from '../WSProvider';
import { getAuctionChannel } from './AuctionSubscription';
import { useNavigate } from 'react-router-dom';
interface AuctionAuth {
	signature: string;
	data: {
		auctioneer: string;
		auctioneer_nonce: number;
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
	};
}

export const AuctionList = () => {
	const [auctions, setAuctions] = useState<AuctionAuth[]>([]);
  const [activeAuctionRoom, setActiveAuctionRoom] = useState<string | null>(null);
	const { subscribe, unsubscribe, isConnected, sendMessage } = useWS();
  const navigate = useNavigate();
	useEffect(() => {
		const handleAuctionMessage = (message: string) => {
			try {
				const auctionData = JSON.parse(message);
				if (auctionData.type === 'auction_auth') {
					console.log('Received auction data:', auctionData);
					// Convert hash array to string if needed
					setAuctions(prev => [...prev, auctionData]);
				}
			} catch (error) {
				console.error('Error parsing auction message:', error);
			}
		};

		subscribe(getAuctionChannel(), handleAuctionMessage);
		return () => unsubscribe(getAuctionChannel());
	}, [subscribe, unsubscribe]);

	const handleEnterAuctionRoom = (auction: any) => {
    auction.data.message.timestamp = auction.data.timestamp
    navigate(`/auctions/${auction.signature}`, {
      state: {
        auctionParams: auction.data.message
      }
    });
	};

	const formatAddress = (address: string) => {
		if (!address) return 'N/A';
		if (address.startsWith('0x')) {
			return `${address.slice(0, 6)}...${address.slice(-4)}`;
		}
		return address;
	};

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	if (!isConnected) {
		return <div>Connecting to auction service...</div>;
	}

	return (
  <div className="data-table-container">
      <h2>Recent Auction Authorizations</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th className="time-column">Time</th>
            <th className="address-column">Auctioneer</th>
            <th className="address-column">NFT Collection</th>
            <th className="number-column">NFT ID</th>
            <th className="number-column">Min Bid</th>
            <th className="address-column">Token</th>
            <th className="time-column">Deadline</th>
            <th className="address-column">Hash</th>
            <th className="action-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((auction, index) => (
            <tr key={`${auction.signature}-${index}`}>
              <td className="time-column">{formatTimestamp(auction.data.timestamp)}</td>
              <td className="address-column">{formatAddress(auction.data.message.auctioneer)}</td>
              <td className="address-column">{formatAddress(auction.data.message.nft.collection_address)}</td>
              <td className="number-column">{auction.data.message.nft.nft_id}</td>
              <td className="number-column">{auction.data.message.min_bid.amount}</td>
              <td className="address-column">{formatAddress(auction.data.message.min_bid.token_address)}</td>
              <td className="time-column">{formatTimestamp(auction.data.message.deadline * 1000)}</td>
              <td className="address-column">{formatAddress(auction.signature)}</td>
              <td className="action-column">
                <button onClick={() => handleEnterAuctionRoom(auction)}>
                  Enter Auction Room
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
									);
									};
