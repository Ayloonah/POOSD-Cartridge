import React from 'react';
import logo from '../assets/Menu & Fab.png';
import searchIcon from '../assets/Icon.png';

const mockGames = [
  { id: 1, title: 'Pokémon Red', releaseYear: 1996 },
  { id: 2, title: 'Pokémon Gold', releaseYear: 1999 },
  { id: 3, title: 'Pokémon Ruby', releaseYear: 2002 },
  { id: 4, title: 'Pokémon Diamond', releaseYear: 2006 },
  { id: 5, title: 'Pokémon Black', releaseYear: 2010 },
  { id: 6, title: 'Pokémon X', releaseYear: 2013 },
];

const ListView = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'monospace, sans-serif' }}>
      
      {/* 1. Sidebar */}
      <div style={{ width: '260px', backgroundColor: '#787878', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px', display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="Cartridge Logo" style={{ width: '160px', height: 'auto' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '25px' }}>
          {['Home', 'Collections', 'Profile', 'Settings'].map((item) => (
            <button key={item} style={{ 
              padding: '16px 20px', 
              backgroundColor: item === 'Collections' ? '#98B910' : 'transparent', 
              border: 'none', 
              color: item === 'Collections' ? '#143910' : '#fff', 
              textAlign: 'left', 
              borderRadius: '30px', 
              fontWeight: 'bold', 
              fontSize: '18px',
              cursor: 'pointer' 
            }}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header - Massive Search Bar */}
        <div style={{ backgroundColor: '#143910', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 30px', borderBottom: '6px solid #0b1f09' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px' }}>
            <input type="text" placeholder="Search..." style={{ width: '100%', padding: '16px 50px 16px 25px', borderRadius: '40px', border: 'none', backgroundColor: '#98B910', fontWeight: 'bold', fontSize: '18px', outline: 'none' }} />
            <img src={searchIcon} alt="Search" style={{ position: 'absolute', right: '-50px', top: '50%', transform: 'translateY(-50%)', width: '28px', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Content Panel */}
        <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '3px solid #e2e8f0', paddingBottom: '20px' }}>
            {/* Collection Name Updated */}
            <h1 style={{ fontSize: '36px', color: '#143910', margin: 0 }}>Pokémon</h1>
            <button style={{ backgroundColor: '#143910', color: '#fff', border: 'none', padding: '14px 25px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Game</button>
          </div>

          {/* Grid View */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '40px' }}>
            {mockGames.map((game) => (
              <div key={game.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '180px', height: '180px', backgroundColor: '#f1f5f9', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '2px solid #e2e8f0', marginBottom: '15px' }}>
                  👾 Cover
                </div>
                <span style={{ fontWeight: '700', fontSize: '20px', textAlign: 'center', color: '#143910' }}>{game.title}</span>
                <span style={{ fontSize: '16px', color: '#64748b' }}>{game.releaseYear}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListView;