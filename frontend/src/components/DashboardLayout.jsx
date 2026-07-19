import React from 'react';
import Sidebar from './Sidebar';

import searchIcon from '../assets/Search.svg'; 
import profileIcon from '../assets/Generic avatar.svg'; 

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      
     
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <header style={{ height: '80px', backgroundColor: '#143910', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'space-between', flexShrink: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#98B910', padding: '8px 16px', borderRadius: '24px', width: '60%', maxWidth: '600px' }}>
            <img 
              src={searchIcon} 
              alt="Search" 
              style={{ width: '20px', height: '20px', marginRight: '8px' }} 
            />
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', color: '#143910', fontFamily: 'Inter' }}
            />

          </div>

          <div style={{ width: '40px', height: '40px', backgroundColor: '#98B910', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', overflow: 'hidden' }}>
            <img 
              src={profileIcon} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {children}
        </main>

      </div>
    </div>
  );
}