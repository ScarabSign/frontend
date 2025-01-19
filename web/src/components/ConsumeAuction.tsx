import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import ScarabSign from '../assets/abi/ScarabSign.json'
import { useContract, useSendTransaction, useSignTypedData, useAccount } from "@starknet-react/core"
import { useWS } from '../WSProvider'
import { shortString } from 'starknet'
import { useParams } from 'react-router-dom'
import { formatStarknetSignature, splitSignature, toStarknetAmount, toUint256, toEcdsaSignature	} from '../utils'
import { stark, uint256} from 'starknet'

const SN_SEPOLIA = '0x534e5f5345504f4c4941'

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

interface AuctionAuth {
	signature: string;
	data: {
		message: {
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
	};
}

interface ConsumeAuctionProps {
	auction: AuctionAuth;
	bids: Bid[];
}

const useInitiateConsume = ({ onConsumeCreated }: { onConsumeCreated: (consume: any) => void }) => {
	const { auctionSigHash } = useParams()
	const { sendMessage } = useWS()
	const { signTypedDataAsync } = useSignTypedData({})
	const [hash, setHash] = useState<string | null>(null)
	const { address,chainId } = useAccount()
	const [auction, setAuction] = useState<AuctionAuth | null>(null)
	const { contract } = useContract({
		address: ScarabSign.address,
		abi: ScarabSign.abi
	})
	const {sendAsync, error} = useSendTransaction({})

	const fetchConsumeAuth = useCallback(async (auction: AuctionAuth, bids: Bid[]) => {
		if (!chainId || !auctionSigHash || !contract) return
			try {
				const message = {
					auctioneer: auction.data.message.auctioneer,
					auctioneer_nonce: Math.floor(Date.now() / 1000).toString(),
					nft: {
						collection_address: auction.data.message.nft.collection_address,
						nft_id: auction.data.message.nft.nft_id.toString()
					},
					min_bid: {
						token_address: auction.data.message.min_bid.token_address,
						amount: auction.data.message.min_bid.amount.toString()
					},
					deadline: auction.data.message.deadline.toString(),
					auction_sig_hash: auctionSigHash,
					bids: bids.map(bid => ({
						bidder: bid.data.bidder,
						amount: {
							token_address: bid.data.bid.token_address,
							amount: bid.data.bid.amount
						},
						nonce: bid.data.nonce,
						auction_sig_hash: bid.data.auction_sig_hash
					})),
					bid_sigs: bids.map(bid => bid.data.signature || formatStarknetSignature(bid.hash))
				}
				console.log('message', message)
				const domain = {
					name: "scarab_auction",
					version: "1",
					chainId: shortString.encodeShortString(SN_SEPOLIA),
					revision: "1"
				}

				const typedData = {
					message,
					domain,
					types: {
						StarknetDomain: [
							{ name: "name", type: "string" },
							{ name: "version", type: "string" },
							{ name: "chainId", type: "string" },
							{ name: "revision", type: "string" }
						],
						NFT: [
							{ name: "collection_address", type: "string" },
							{ name: "nft_id", type: "string" }
						],
						TokenAmount: [
							{ name: "token_address", type: "string" },
							{ name: "amount", type: "string" }
						],
						Bid: [
							{ name: "bidder", type: "string" },
							{ name: "amount", type: "TokenAmount" },
							{ name: "nonce", type: "string" },
							{ name: "auction_sig_hash", type: "string" }
						],
						Auction: [
							{ name: "auctioneer", type: "string" },
							{ name: "auctioneer_nonce", type: "string" },
							{ name: "nft", type: "NFT" },
							{ name: "min_bid", type: "TokenAmount" },
							{ name: "deadline", type: "string" },
							{ name: "auction_sig_hash", type: "string" },
							{ name: "bids", type: "Bid*" },
							{ name: "bid_sigs", type: "string*" },
						]
					},
					primaryType: "Auction"
				}
				const signature = await signTypedDataAsync(typedData)
				try {
					console.log('signature', signature)
					console.log('message', message)

					// In your fetchConsumeAuth function, modify the auctionStruct:
					const auctionStruct = {
						auctioneer: message.auctioneer,
						auctioneer_nonce: BigInt(message.auctioneer_nonce),
						nft: {
							collection_address: message.nft.collection_address,
							nft_id: toUint256(message.nft.nft_id)
						},
						min_bid: {
							token_address: message.min_bid.token_address,
							amount: toUint256(message.min_bid.amount)
						},
						deadline: BigInt(message.deadline),
						auction_sig_hash: {
							snapshot: [toEcdsaSignature(message.auction_sig_hash)]
						},
						bids: {
							snapshot: message.bids.map(bid => ({
								bidder: bid.bidder,
								amount: {
									token_address: bid.amount.token_address,
									amount: toUint256(bid.amount.amount)
								},
								nonce: BigInt(bid.nonce),
								auction_sig_hash: {
									snapshot: [toEcdsaSignature(bid.auction_sig_hash)]
								}
							}))
						},
						bid_sigs: {
							snapshot: message.bid_sigs.map(sig => ({
								snapshot: [toEcdsaSignature(sig)]
							}))
						}
					}

					// Then for the transaction:
					const mainSig = toEcdsaSignature(formatStarknetSignature(signature))
					const tx = await sendAsync([
							contract.populate('consume_auction', [
								auctionStruct,
								BigInt(signature[1]),
								BigInt(signature[2]),
							])
						])
					console.log('tx', tx)
				} catch (e) {
					console.error(e)
				}
				const formattedSignature = formatStarknetSignature(signature)
				setHash(formattedSignature)

				const consumeMessage = {
					type: 'consume_auth',
					hash: signature,
					data: {
						...message,
						signature: formattedSignature,
						timestamp: Math.floor(Date.now() / 1000)
					}
				}

				sendMessage(`auctions/${auctionSigHash}`, JSON.stringify(consumeMessage))
				onConsumeCreated(consumeMessage)

			} catch (error) {
				console.error(error)
			}
	}, [signTypedDataAsync, chainId, sendMessage, auctionSigHash, onConsumeCreated, contract, sendAsync])

	return {
		hash,
		fetchConsumeAuth
	}
}

export const ConsumeAuction: React.FC<ConsumeAuctionProps> = ({ auction, bids }) => {
	const { address } = useAccount()
	const { hash, fetchConsumeAuth } = useInitiateConsume({
		onConsumeCreated: (consume) => {
			window.dispatchEvent(new CustomEvent('consumeAuction', { detail: consume }))
		}
	})

	if (address?.toLowerCase() !== auction.data.message.auctioneer.toLowerCase()) {
		return null
	}

	const handleConsume = async () => {
		try {
			await fetchConsumeAuth(auction, bids)
		} catch (error) {
			console.error('Error consuming auction:', error)
		}
	}

	return (
		<div>
			<button onClick={handleConsume}>Consume Auction</button>
		</div>
	)
}
