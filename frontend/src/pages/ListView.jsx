import React, { useState } from 'react';
import logo from '../assets/Menu & Fab.png';
import searchIcon from '../assets/Icon.png';
import GameDetailsModal from '../components/GameDetailsModal';

const initialMockGames = [
  { id: 1, title: 'Pokémon Red', developer: 'Game Freak', rating: '⭐⭐⭐⭐★ (4.5)', coverColor: '#fee2e2', inList: true, hoursPlayed: 45, played: true, platform: 'Game Boy', review: 'Classic masterpiece.' },
  { id: 2, title: 'Pokémon Gold', developer: 'Game Freak', rating: '⭐⭐⭐⭐⭐ (5.0)', coverColor: '#fef3c7', inList: true, hoursPlayed: 120, played: true, platform: 'Game Boy', review: 'The best generation hands down.' },
  { id: 3, title: 'Pokémon Ruby', developer: 'Game Freak', rating: '⭐⭐⭐⭐★ (4.2)', coverColor: '#ecfdf5', inList: true, hoursPlayed: 10, played: false, platform: 'Game Boy', review: 'A bit too much water.' },
  { id: 4, title: 'Pokémon Emerald', developer: 'Game Freak', rating: '⭐⭐⭐⭐⭐ (4.9)', coverColor: '#e0f2fe', inList: false, hoursPlayed: 0, played: false, platform: 'Game Boy', review: '' },
];

const ListView = () => {
  const [localQuery, setLocalQuery] = useState('');
  const [listName, setListName] = useState('Pokémon Collection');
  const [games, setGames] = useState(initialMockGames);
  
  const [coverGameId, setCoverGameId] = useState(1); 

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null); 

  const [tempName, setTempName] = useState(listName);
  const [tempGames, setTempGames] = useState(initialMockGames);
  const [tempCoverGameId, setTempCoverGameId] = useState(coverGameId);

  const handleOpenEditModal = () => {
    setTempName(listName);
    setTempGames([...games]);
    setTempCoverGameId(coverGameId);
    setIsEditModalOpen(true);
  };

  const handleToggleGameInList = (id) => {
    setTempGames(tempGames.map(game => 
      game.id === id ? { ...game, inList: !game.inList } : game
    ));
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    setListName(tempName);
    setGames(tempGames);
    setCoverGameId(tempCoverGameId);
    setIsEditModalOpen(false);
  };

  const handleDeleteList = () => {
    if (window.confirm("Are you sure you want to delete this list?")) {
      setListName("Deleted List");
      setGames(games.map(g => ({ ...g, inList: false })));
      setIsEditModalOpen(false);
    }
  };

  // game entry handler
  const handleUpdateGameEntry = (e) => {
    e.preventDefault();
    setGames(games.map(g => g.id === selectedGame.id ? selectedGame : g));
    setSelectedGame(null);
  };

  const activeListGames = games.filter(game => game.inList);

  const filteredListGames = activeListGames.filter(game => 
    game.title.toLowerCase().includes(localQuery.toLowerCase()) ||
    game.developer.toLowerCase().includes(localQuery.toLowerCase())
  );
  
  const activeCoverGame = games.find(g => g.id === coverGameId) || activeListGames[0];
  const currentCoverColor = activeCoverGame?.coverColor || '#cbd5e1';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'monospace, sans-serif' }}>
      
      {/* 1. Sidebar */}
      <div style={{ width: '260px', backgroundColor: '#787878', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px', display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="Cartridge Logo" style={{ width: '160px', height: 'auto' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '25px' }}>
          {['Home', 'Collections', 'Profile', 'Settings'].map((item) => (
            <button key={item} style={{ padding: '16px 20px', backgroundColor: item === 'Collections' ? '#98B910' : 'transparent', border: 'none', color: item === 'Collections' ? '#143910' : '#fff', textAlign: 'left', borderRadius: '30px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: '#143910', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 30px', borderBottom: '6px solid #0b1f09' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px' }}>
            <input 
              type="text" 
              placeholder="Search this list..." 
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              style={{ width: '100%', padding: '16px 50px 16px 25px', borderRadius: '40px', border: 'none', backgroundColor: '#98B910', fontWeight: 'bold', fontSize: '18px', outline: 'none' }} 
            />
            <img src={searchIcon} alt="Search" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '28px' }} />
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '3px solid #e2e8f0', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: currentCoverColor, borderRadius: '12px', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📁</div>
              <div>
                <h1 style={{ fontSize: '36px', color: '#143910', margin: 0 }}>{listName}</h1>
                <button onClick={handleOpenEditModal} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '14px', marginTop: '4px' }}>
                  ⚙️ Edit List Specs
                </button>
              </div>
            </div>
            <button onClick={() => alert("Redirecting to Game Search Page branch...")} style={{ backgroundColor: '#143910', color: '#fff', border: 'none', padding: '14px 25px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              + Add Game
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '40px' }}>
            {filteredListGames.map((game) => (
              <div key={game.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedGame(game)}>
                <div style={{ width: '180px', height: '180px', backgroundColor: game.coverColor, borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '2px solid #e2e8f0', marginBottom: '15px' }}>
                  👾 Cover
                </div>
                <span style={{ fontWeight: '700', fontSize: '20px', textAlign: 'center', color: '#143910' }}>{game.title}</span>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>{game.developer}</span>
                <span style={{ fontSize: '14px', color: '#b45309', marginTop: '4px' }}>{game.rating}</span>
              </div>
            ))}
            
            {activeListGames.length === 0 && (
              <p style={{ color: '#64748b', fontWeight: 'bold' }}>This list is empty. Click edit or Add Games to populate titles.</p>
            )}
            {activeListGames.length > 0 && filteredListGames.length === 0 && (
              <p style={{ color: '#64748b', fontWeight: 'bold' }}>No titles in this collection match "{localQuery}".</p>
            )}
          </div>
        </div>
      </div>

      {/* EDIT LIST POPUP MODAL */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '20px', width: '90%', maxWidth: '500px', border: '4px solid #143910' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#143910' }}>Manage List Settings</h2>
            <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>List Name:</label>
                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #cbd5e1', fontWeight: 'bold', fontFamily: 'monospace' }} required />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Use Cover from:</label>
                <select value={tempCoverGameId} onChange={(e) => setTempCoverGameId(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #cbd5e1' }}>
                  {tempGames.filter(g => g.inList).map((game) => (
                    <option key={`cover-opt-${game.id}`} value={game.id}>{game.title}</option>
                  ))}
                  {tempGames.filter(g => g.inList).length === 0 && <option value={0}>No games in list (Default folder icon)</option>}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Included Games:</label>
                <div style={{ border: '2px solid #cbd5e1', borderRadius: '8px', padding: '12px', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tempGames.map((game) => (
                    <label key={`check-${game.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={game.inList} onChange={() => handleToggleGameInList(game.id)} style={{ width: '16px', height: '16px' }} />
                      {game.title}
                    </label>
                  ))}
                </div>
              </div>

              <button type="button" onClick={handleDeleteList} style={{ width: 'fit-content', background: 'none', border: 'none', color: '#dc2626', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '13px' }}>
                ⚠️ Delete List Completely
              </button>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '12px', border: '2px solid #787878', backgroundColor: 'transparent', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: '#143910', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GAME ENTRY DETAILS MODAL */}
      <GameDetailsModal 
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
        onSubmit={handleUpdateGameEntry}
        gameData={selectedGame}
        setGameData={setSelectedGame}
      />
    </div>
  );
};

export default ListView;