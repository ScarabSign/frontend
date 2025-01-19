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
		<div>
			<h2>Recent Auction Authorizations</h2>
			<table>
				<thead>
					<tr>
						<th>Time</th>
						<th>Auctioneer</th>
						<th>NFT Collection</th>
						<th>NFT ID</th>
						<th>Min Bid</th>
						<th>Token</th>
						<th>Deadline</th>
						<th>Hash</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{auctions.map((auction, index) => (
						<tr key={`${auction.signature}-${index}`}>
							<td>{formatTimestamp(auction.data.timestamp)}</td>
							<td>{formatAddress(auction.data.message.auctioneer)}</td>
							<td>{formatAddress(auction.data.message.nft.collection_address)}</td>
							<td>{auction.data.message.nft.nft_id}</td>
							<td>{auction.data.message.min_bid.amount}</td>
							<td>{formatAddress(auction.data.message.min_bid.token_address)}</td>
							<td>{formatTimestamp(auction.data.message.deadline * 1000)}</td>
							<td>{formatAddress(auction.signature)}</td>
							<td>
								<button
									onClick={() => {
										handleEnterAuctionRoom(auction); 
									}}>
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
