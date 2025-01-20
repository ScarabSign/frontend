import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../navbar.css';
import {WalletStatus} from './WalletStatus'
import {Balances} from './Balances'
export const NavBar = () => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            {/* You can add an SVG icon here */}
            Scarab Sign
          </Link>
          <Link 
            to="/" 
            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Auctions
          </Link>
        </div>
        
        <div className="navbar-right">
          <WalletStatus />
          <Balances />
        </div>
      </div>
    </nav>
  );
};
