import './App.css'

import {AuthorizeAuction} from './components/AuthorizeAuction'
import { AuctionList	} from './components/AuctionList'
function App() {
  console.log('reload')
  return (
    <>
      <AuthorizeAuction />
			<AuctionList />
    </>
  )
}

export default App
