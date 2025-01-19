import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSignTypedData } from "@starknet-react/core";

import { useWS  } from '../WSProvider';
import { getAuctionChannel  } from './AuctionSubscription';

import { stark, shortString  } from 'starknet';
import { useContract, useAccount } from '@starknet-react/core'

import ScarabSign from '../assets/abi/ScarabSign.json'
import ERC721 from '../assets/abi/MockERC721.json'
import ERC20 from '../assets/abi/MockERC20.json'

const SN_SEPOLIA = '0x534e5f5345504f4c4941';

/*
   const AUCTION_AUTH_TYPE_HASH = stark.getSelectorFromName(
   'AuctionAuth(auctioneer:ContractAddress,auctioneer_nonce:u64,nft:NftId,min_bid:TokenAmount,deadline:u64)NftId(collection_address:ContractAddress,nft_id:u256)TokenAmount(token_address:ContractAddress,amount:u256)u256(low:u128,high:u128)'

   );
 */
const useInitiateAuction = () => {
  const { sendMessage  } = useWS(); // Add this line

  const { signTypedDataAsync, error: signError } = useSignTypedData({});
  const [hash, setHash] = useState<string | null>(null)
  const { account,chainId  } = useAccount()
  const { contract } = useContract({
    address: ScarabSign.address,
    abi: ScarabSign.abi
  })

  const fetchAuctionAuth =  useCallback(async (data: AuctionAuthFormData) => {
    if (!chainId) return
      try {
        const message = {
          auctioneer: data.auctioneer,
          auctioneer_nonce: data.auctioneer_nonce.toString(),
          nft: {
            collection_address: data.nft.collection_address,
            nft_id: data.nft.nft_id.toString()
          },
          min_bid: {
            token_address: data.min_bid.token_address,
            amount: data.min_bid.amount.toString()
          },
          deadline: data.deadline.toString()
        }
        const domain ={
          name: "scarab_auction",
          version: "1",
          chainId: shortString.encodeShortString(SN_SEPOLIA),
          revision: "1"
        }
        console.log(message, domain)
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
            Nft: [
              { name: "collection_address", type: "string" },
              { name: "nft_id", type: "string" }
            ],
            AuctionAuth: [
              { name: "auctioneer", type: "string" },
              { name: "auctioneer_nonce", type: "string" },
              { name: "nft", type: "Nft" },
              { name: "min_bid", type: "TokenAmount" },
              { name: "deadline", type: "string" }
            ]
          },
          primaryType: "AuctionAuth",
        }
      const hash = await signTypedDataAsync(typedData)
      console.log('hash', hash)
      setHash(hash)
      sendMessage(getAuctionChannel(), JSON.stringify({
        type: 'auction_auth',
        hash,
        data: {
          ...typedData,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }))
  } catch (error) {
    console.error(error)
  }
}, [signTypedDataAsync, chainId])

return {
  hash,
  fetchAuctionAuth
}
}


interface AuctionAuthFormData {
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
}

export const AuthorizeAuction = () => {
  const { hash, fetchAuctionAuth } = useInitiateAuction()
  const { address } = useAccount()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AuctionAuthFormData>({
    defaultValues: async () => {
      return {
        auctioneer: address || '',
        auctioneer_nonce: Math.floor(Date.now() / 1000),
        nft: {
          collection_address: ERC721.address,
          nft_id: 0
        },
        min_bid: {
          token_address: ERC20.address,
          amount: 100
        },
        deadline: Math.floor(Date.now() / 1000) + 3600
      }
    }
  });

  useEffect(() => {
    reset({
      auctioneer: address || '',
      auctioneer_nonce: 0,
      nft: {
        collection_address: ERC721.address,
        nft_id: 0
      },
      min_bid: {
        token_address: ERC20.address,
        amount: 100
      },
      deadline: Math.floor(Date.now() / 1000) + 3600
    })

  }, [address, reset])
  const onSubmit = async (data: AuctionAuthFormData) => {
    try {
      fetchAuctionAuth(data);
    } catch (error) {
      console.error('Error creating auction auth:', error);
    }
  };

  return (<>
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Auctioneer Address</label>
        <input
          {...register("auctioneer", { 
            required: "Required",
            pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address" }
          })}
          placeholder="0x..."
        />
        {errors.auctioneer && <span>{errors.auctioneer.message}</span>}
      </div>

      <div>
        <label>Auctioneer Nonce</label>
        <input
          type="number"
          {...register("auctioneer_nonce", { 
            required: "Required",
            min: { value: 0, message: "Must be positive" }
          })}
        />
        {errors.auctioneer_nonce && <span>{errors.auctioneer_nonce.message}</span>}
      </div>

      <div>
        <label>NFT Collection Address</label>
        <input
          {...register("nft.collection_address", {
            required: "Required",
            pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address" }
          })}
          placeholder="0x..."
        />
        {errors.nft?.collection_address && <span>{errors.nft.collection_address.message}</span>}
      </div>

      <div>
        <label>NFT ID</label>
        <input
          type="number"
          {...register("nft.nft_id", {
            required: "Required",
            min: { value: 0, message: "Must be positive" }
          })}
        />
        {errors.nft?.nft_id && <span>{errors.nft.nft_id.message}</span>}
      </div>

      <div>
        <label>Bid Token Address</label>
        <input
          {...register("min_bid.token_address", {
            required: "Required",
            pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address" }
          })}
          placeholder="0x..."
        />
        {errors.min_bid?.token_address && <span>{errors.min_bid.token_address.message}</span>}
      </div>

      <div>
        <label>Minimum Bid Amount</label>
        <input
          type="number"
          {...register("min_bid.amount", {
            required: "Required",
            min: { value: 0, message: "Must be positive" }
          })}
        />
        {errors.min_bid?.amount && <span>{errors.min_bid.amount.message}</span>}
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

      <button type="submit">Create Auction Auth</button>
    </form>
    {hash && <p>Auction Auth Hash: {hash}</p>}
  </>
         );
}	
