import React from 'react';
import Button from './Button';

export default function Navbar() {
  return (
    <nav style={{ 
      backgroundColor: '#143910', 
      padding: '24px 48px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      borderBottom: '4px solid #000' 
    }}>
      <div className="font-pixel" style={{ 
        color: '#98B910', 
        fontSize: '32px', 
        textShadow: '3px 3px 0px #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' 
      }}>
        CARTRIDGE
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Button variant="tertiary">Sign in</Button>
        <Button variant="secondary">Register</Button>
      </div>
    </nav>
  );
}