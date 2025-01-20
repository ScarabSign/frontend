import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { StarknetProvider } from './StarknetProvider'	
import { WSProvider } from './WSProvider'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuctionSubscription } from './components/AuctionSubscription'	
import { NavBar } from './components/NavBar'
import App from './views/App.tsx'
import { AuctionRoom } from './views/AuctionRoom'	

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WSProvider	>
      <StarknetProvider>
        <AuctionSubscription />
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<App />} />
						<Route path="/auctions/:auctionSigHash" element={<AuctionRoom />} />

          </Routes>
        </BrowserRouter>
      </StarknetProvider>
    </WSProvider>
  </StrictMode>,
)
