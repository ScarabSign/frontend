import '../Form.css'	
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSignTypedData } from "@starknet-react/core";

import { useWS  } from '../WSProvider';
import { getAuctionChannel  } from './AuctionSubscription';

import { stark, shortString  } from 'starknet';
import { useContract, useAccount } from '@starknet-react/core'
import { useNavigate } from 'react-router-dom';
import ScarabSign from '../assets/abi/ScarabSign.json'
import ERC721 from '../assets/abi/MockERC721.json'
import ERC20 from '../assets/abi/MockERC20.json'
import { formatStarknetSignature } from '../utils'
const SN_SEPOLIA = '0x534e5f5345504f4c4941';

/*
   const AUCTION_AUTH_TYPE_HASH = stark.getSelectorFromName(
   'AuctionAuth(auctioneer:ContractAddress,auctioneer_nonce:u64,nft:NftId,min_bid:TokenAmount,deadline:u64)NftId(collection_address:ContractAddress,nft_id:u256)TokenAmount(token_address:ContractAddress,amount:u256)u256(low:u128,high:u128)'

   );
 */
const useInitiateAuction = () => {
  const { sendMessage  } = useWS();
  const navigate = useNavigate()

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
      const signature = formatStarknetSignature(hash)
      setHash(signature)
      sendMessage(getAuctionChannel(), JSON.stringify({
        type: 'auction_auth',
        signature,
        data: {
          ...typedData,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }))
      navigate('/auctions/' + signature, {
        state: {
          auctionParams: {
            auctioneer: message.auctioneer,
            nft: message.nft,
            min_bid: message.min_bid,
            deadline: parseInt(message.deadline),
            timestamp: Math.floor(Date.now() / 1000)
          }
        }
      })
  } catch (error) {
    console.error(error)
  }
}, [signTypedDataAsync, chainId, navigate, sendMessage ])

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

  return (
<>
      <form className="form-container" onSubmit={handleSubmit(onSubmit)}>
				<div className="form-group">
        <div className="form-field">
          <label className="form-label">Auctioneer Address</label>
          <input
            className="form-input"
            {...register("auctioneer", { 
              required: "Required",
              pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address" }
            })}
            placeholder="0x..."
          />
          {errors.auctioneer && <span className="error-message">{errors.auctioneer.message}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Auctioneer Nonce</label>
          <input
            className="form-input"
            type="number"
            {...register("auctioneer_nonce", { 
              required: "Required",
              min: { value: 0, message: "Must be positive" }
            })}
          />
          {errors.auctioneer_nonce && <span className="error-message">{errors.auctioneer_nonce.message}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">NFT Collection Address</label>
          <input
            className="form-input"
            {...register("nft.collection_address", {
              required: "Required",
              pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address" }
            })}
            placeholder="0x..."
          />
          {errors.nft?.collection_address && <span className="error-message">{errors.nft.collection_address.message}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">NFT ID</label>
          <input
            className="form-input"
            type="number"
            {...register("nft.nft_id", {
              required: "Required",
              min: { value: 0, message: "Must be positive" }
            })}
          />
          {errors.nft?.nft_id && <span className="error-message">{errors.nft.nft_id.message}</span>}
        </div>
				</div>
				<div className="form-group">
        <div className="form-field">
          <label className="form-label">Bid Token Address</label>
          <input
            className="form-input"
            {...register("min_bid.token_address", {
              required: "Required",
              pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address" }
            })}
            placeholder="0x..."
          />
          {errors.min_bid?.token_address && <span className="error-message">{errors.min_bid.token_address.message}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Minimum Bid Amount</label>
          <input
            className="form-input"
            type="number"
            {...register("min_bid.amount", {
              required: "Required",
              min: { value: 0, message: "Must be positive" }
            })}
          />
          {errors.min_bid?.amount && <span className="error-message">{errors.min_bid.amount.message}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Deadline</label>
          <input
            className="form-input"
            type="number"
            {...register("deadline", {
              required: "Required",
              min: { value: Math.floor(Date.now() / 1000), message: "Must be future" }
            })}
          />
          {errors.deadline && <span className="error-message">{errors.deadline.message}</span>}
        </div>
          <div className="form-field">
            <label style={{color:'transparent'}} className="form-label">Sign</label>
        <button type="submit" className="submit-button">Create Auction Auth</button>
          </div>
				</div>
      </form>
      
      {hash && <p className="hash-display">Auction Auth Hash: {hash}</p>}
    </>
         );
}	
