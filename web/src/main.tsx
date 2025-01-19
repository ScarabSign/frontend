import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { StarknetProvider } from './StarknetProvider'	
import { WSProvider } from './WSProvider'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuctionSubscription } from './components/AuctionSubscription'	
import { WalletStatus } from './components/WalletStatus'
import { Balances } from './components/Balances'

import App from './views/App.tsx'
import { AuctionRoom } from './views/AuctionRoom'	

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WSProvider	>
      <StarknetProvider>
        <AuctionSubscription />
        <WalletStatus />
        <Balances />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
						<Route path="/auctions/:auctionSigHash" element={<AuctionRoom />} />

          </Routes>
        </BrowserRouter>
      </StarknetProvider>
    </WSProvider>
  </StrictMode>,
)
