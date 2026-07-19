import React from 'react';
import logoImage from '../assets/Menu & Fab.png';

export default function Sidebar() {
  return (
    <aside style={{ 
      width: '220px', 
      backgroundColor: '#7A7A7A', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '32px 0', 
      flexShrink: 0 
    }}>
      
      <img 
        src={logoImage} 
        alt="Cartridge Logo" 
        style={{ 
          width: '80px', 
          height: 'auto', 
          marginBottom: '64px',
          // border: '4px solid #143910', backgroundColor: '#98B910'
        }} 
      />

      {/* Navigation */}
      <nav style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px', 
        alignItems: 'center' 
      }}>
        <div className="font-vt323" style={{ 
          backgroundColor: '#98B910', 
          color: '#143910', 
          padding: '8px 40px', 
          borderRadius: '20px', 
          fontSize: '24px', 
          cursor: 'pointer', 
          letterSpacing: '1px' 
        }}>
          Home
        </div>
        
        <div className="font-vt323" style={{ color: '#FFFFFF', fontSize: '24px', cursor: 'pointer', letterSpacing: '1px' }}>
          Collections
        </div>
        <div className="font-vt323" style={{ color: '#FFFFFF', fontSize: '24px', cursor: 'pointer', letterSpacing: '1px' }}>
          Profile
        </div>
        <div className="font-vt323" style={{ color: '#FFFFFF', fontSize: '24px', cursor: 'pointer', letterSpacing: '1px' }}>
          Settings
        </div>
      </nav>
    </aside>
  );
}