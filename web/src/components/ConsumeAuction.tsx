import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSignTypedData, useAccount } from "@starknet-react/core"
import { useWS } from '../WSProvider'
import { shortString } from 'starknet'
import { useParams } from 'react-router-dom'
import { formatStarknetSignature } from '../utils'

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
  const { chainId } = useAccount()

  const fetchConsumeAuth = useCallback(async (auction: AuctionAuth, bids: Bid[]) => {
    if (!chainId || !auctionSigHash) return
    try {
      const message = {
        auctioneer: auction.data.message.auctioneer,
        nonce: Math.floor(Date.now() / 1000).toString(),
        nft: {
          collection_address: auction.data.message.nft.collection_address,
          nft_id: auction.data.message.nft.nft_id.toString()
        },
        bids: bids.map(bid => ({
          bidder: bid.data.bidder,
          token_address: bid.data.bid.token_address,
          amount: bid.data.bid.amount
        })),
        bid_sigs: bids.map(bid => bid.data.signature || formatStarknetSignature(bid.hash)),
        deadline: auction.data.message.deadline.toString()
      }
      
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
          Bid: [
            { name: "bidder", type: "string" },
            { name: "token_address", type: "string" },
            { name: "amount", type: "string" }
          ],
          Auction: [
            { name: "auctioneer", type: "string" },
            { name: "nonce", type: "string" },
            { name: "nft", type: "NFT" },
            { name: "bids", type: "Bid*" },
            { name: "bid_sigs", type: "string*" },
            { name: "deadline", type: "string" }
          ]
        },
        primaryType: "Auction"
      }

      const signature = await signTypedDataAsync(typedData)
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
  }, [signTypedDataAsync, chainId, sendMessage, auctionSigHash, onConsumeCreated])

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
