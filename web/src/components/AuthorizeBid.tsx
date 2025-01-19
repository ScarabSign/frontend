import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSignTypedData, useAccount } from "@starknet-react/core"
import { useWS } from '../WSProvider'
import { shortString } from 'starknet'
import { useParams } from 'react-router-dom'
import ERC20 from '../assets/abi/MockERC20.json'
import { formatStarknetSignature } from '../utils'

const SN_SEPOLIA = '0x534e5f5345504f4c4941'

interface BidAuthFormData {
  bidder: string
  bidder_nonce: number
  auction_id: string
  bid: {
    token_address: string
    amount: number
  }
  deadline: number
}

const useInitiateBid = ({ onBidCreated }: { onBidCreated: (bid: any) => void }) => {
  const { auctionSigHash } = useParams()
  const { sendMessage } = useWS()
  const { signTypedDataAsync } = useSignTypedData({})
  const [hash, setHash] = useState<string | null>(null)
  const { account, chainId } = useAccount()

  const fetchBidAuth = useCallback(async (data: BidAuthFormData) => {
    if (!chainId || !auctionSigHash) return
    try {
      const message = {
        bidder: data.bidder,
        nonce: data.bidder_nonce.toString(),
        auction_sig_hash: auctionSigHash,
        bid: {
          token_address: data.bid.token_address,
          amount: data.bid.amount.toString()
        },
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
          TokenAmount: [
            { name: "token_address", type: "string" },
            { name: "amount", type: "string" }
          ],
          Bid: [
            { name: "bidder", type: "string" },
            { name: "nonce", type: "string" },
            { name: "auction_sig_hash", type: "string" },
            { name: "bid", type: "TokenAmount" },
          ]
        },
        primaryType: "Bid"
      }

      const signature = await signTypedDataAsync(typedData)
      const formattedSignature = formatStarknetSignature(signature)
      setHash(formattedSignature)
      
      const bidMessage = {
        type: 'bid_auth',
        hash: signature,
        data: {
          ...message,
          signature: formattedSignature,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      // Send to websocket
      sendMessage(`auctions/${auctionSigHash}`, JSON.stringify(bidMessage))
      
      // Optimistically update local state
      onBidCreated(bidMessage)

    } catch (error) {
      console.error(error)
    }
  }, [signTypedDataAsync, chainId, sendMessage, auctionSigHash, onBidCreated])

  return {
    hash,
    fetchBidAuth
  }
}

export const AuthorizeBid = () => {
  const { hash, fetchBidAuth } = useInitiateBid({
    onBidCreated: (bid) => {
      // Pass this handler down from AuctionRoom to share state between components
      window.dispatchEvent(new CustomEvent('newBid', { detail: bid }))
    }
  })
  const { address } = useAccount()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BidAuthFormData>({
    defaultValues: async () => {
      return {
        bidder: address || '',
        bidder_nonce: Math.floor(Date.now() / 1000),
        bid: {
          token_address: ERC20.address,
          amount: 161
        },
        deadline: Math.floor(Date.now() / 1000) + 3600
      }
    }
  })

  useEffect(() => {
    reset({
      bidder: address || '',
      bidder_nonce: Math.floor(Date.now() / 1000),
      bid: {
        token_address: ERC20.address,
        amount: 161
      },
      deadline: Math.floor(Date.now() / 1000) + 3600
    })
  }, [address, reset])

  const onSubmit = async (data: BidAuthFormData) => {
    try {
      fetchBidAuth(data)
    } catch (error) {
      console.error('Error creating bid auth:', error)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Bidder Address</label>
          <input
            {...register("bidder", { 
              required: "Required",
              pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address" }
            })}
            placeholder="0x..."
          />
          {errors.bidder && <span>{errors.bidder.message}</span>}
        </div>

        <div>
          <label>Bidder Nonce</label>
          <input
            type="number"
            {...register("bidder_nonce", { 
              required: "Required",
              min: { value: 0, message: "Must be positive" }
            })}
          />
          {errors.bidder_nonce && <span>{errors.bidder_nonce.message}</span>}
        </div>

        <div>
          <label>Bid Token Address</label>
          <input
            {...register("bid.token_address", {
              required: "Required",
              pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address" }
            })}
            placeholder="0x..."
          />
          {errors.bid?.token_address && <span>{errors.bid.token_address.message}</span>}
        </div>

        <div>
          <label>Bid Amount</label>
          <input
            type="number"
            {...register("bid.amount", {
              required: "Required",
              min: { value: 0, message: "Must be positive" }
            })}
          />
          {errors.bid?.amount && <span>{errors.bid.amount.message}</span>}
        </div>

        <div>
          <label>Deadline</label>
          <input
            type="number"
            {...register("deadline", {
              required: "Required",
              min: { value: Math.floor(Date.now() / 1000), message: "Must be future" }
            })}
          />
          {errors.deadline && <span>{errors.deadline.message}</span>}
        </div>

        <button type="submit">Create Bid Auth</button>
      </form>
    </>
  )
}
