import React from 'react';

const GameDetailsModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  gameData, 
  setGameData, 
  showListAssignment = false,
  // Default fallback list options if no database/parent state is connected yet
  availableLists = ['Backlog', 'Favorites', 'Playing', 'Completed', 'Dropped'] 
}) => {
  if (!isOpen || !gameData) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '20px', width: '90%', maxWidth: '500px', border: '4px solid #143910', fontFamily: 'monospace, sans-serif' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', borderBottom: '3px solid #e2e8f0', paddingBottom: '15px' }}>
          <div style={{ width: '70px', height: '90px', backgroundColor: gameData.coverColor || gameData.mockColor || '#cbd5e1', borderRadius: '8px', border: '2px solid #143910', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            🎮
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#143910', fontSize: '24px' }}>{gameData.title}</h2>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>
              Platform Target: {gameData.platform || 'N/A'}
            </span>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <label style={{ fontWeight: 'bold', color: '#143910', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={!!gameData.played} 
              onChange={(e) => setGameData({ ...gameData, played: e.target.checked })} 
              style={{ width: '18px', height: '18px' }} 
            /> 
            Mark as Played status
          </label>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Hours Played:</label>
              <input 
                type="number" 
                min="0" 
                value={gameData.hoursPlayed || 0} 
                onChange={(e) => setGameData({ ...gameData, hoursPlayed: Number(e.target.value) })} 
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '2px solid #cbd5e1' }} 
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Platform:</label>
              <select 
                value={gameData.platform || 'PC'} 
                onChange={(e) => setGameData({ ...gameData, platform: e.target.value })} 
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '2px solid #cbd5e1' }}
              >
                <option>PC</option>
                <option>Game Boy</option>
                <option>Nintendo Switch</option>
                <option>PlayStation 5</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Personal Rating:</label>
            <select 
              value={gameData.rating || '⭐⭐⭐⭐⭐ (5.0)'} 
              onChange={(e) => setGameData({ ...gameData, rating: e.target.value })} 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '2px solid #cbd5e1' }}
            >
              <option>⭐⭐⭐⭐⭐ (5.0)</option>
              <option>⭐⭐⭐⭐★ (4.0)</option>
              <option>⭐⭐⭐★★ (3.0)</option>
              <option>⭐⭐★★★ (2.0)</option>
              <option>⭐★★★★ (1.0)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Personal Review:</label>
            <textarea 
              rows="3" 
              placeholder="Write thoughts here..."
              value={gameData.review || ''} 
              onChange={(e) => setGameData({ ...gameData, review: e.target.value })} 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '2px solid #cbd5e1', resize: 'none' }}
            />
          </div>

          {/* list assignment dropdown for gamesearchpage */}
          {showListAssignment && (
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Assign to custom List:</label>
              <select 
                value={gameData.listAssignment || availableLists[0]} 
                onChange={(e) => setGameData({ ...gameData, listAssignment: e.target.value })} 
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '2px solid #cbd5e1', backgroundColor: '#fff' }}
              >
                {availableLists.map((list) => (
                  <option key={list} value={list}>
                    {list}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ flex: 1, padding: '12px', border: '2px solid #787878', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: '#143910', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Save Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameDetailsModal;