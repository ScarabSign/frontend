import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StarknetProvider } from './StarknetProvider'	
import { WSProvider } from './WSProvider'

import { AuctionRoom } from './components/AuctionRoom'	
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuctionSubscription } from './components/AuctionSubscription'	
import { WalletStatus } from './components/WalletStatus'
import { Balances } from './components/Balances'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WSProvider	>
      <StarknetProvider>
        <BrowserRouter>
          <Routes>
            <AuctionSubscription />
            <WalletStatus />
            <Balances />
            <Route path="/" element={<App />} />
						<Route path="/auctions/:auctionSigHash" element={<AuctionRoom />} />

          </Routes>
        </BrowserRouter>
      </StarknetProvider>
    </WSProvider>
  </StrictMode>,
)
