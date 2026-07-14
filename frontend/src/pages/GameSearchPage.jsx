import React, { useState, useEffect } from 'react';
import logo from '../assets/Menu & Fab.png';
import searchIcon from '../assets/Icon.png';
import GameDetailsModal from '../components/GameDetailsModal';

const GameSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedGame, setSelectedGame] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [modalFormData, setModalFormData] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/games/search?title=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setResults(data.results || data);
      } catch (error) {
        setResults([
          { id: 101, title: `${query} Red Version`, platform: 'Game Boy', year: 1996, mockColor: '#fee2e2' },
          { id: 102, title: `${query} Blue Version`, platform: 'Game Boy', year: 1996, mockColor: '#e0f2fe' },
          { id: 103, title: `${query} Yellow`, platform: 'Game Boy', year: 1998, mockColor: '#fef3c7' },
        ]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const openAddModal = (game) => {
    setSelectedGame(game);
    // Merge baseline game data and the defaults for our form state
    setModalFormData({
      ...game,
      played: false,
      hoursPlayed: 0,
      rating: '⭐⭐⭐⭐⭐ (5.0)',
      review: '',
      listAssignment: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveEntry = (e) => {
    e.preventDefault();
    alert(`Saved UserGameEntry for "${selectedGame.title}"!`);
    setIsModalOpen(false);
    setSelectedGame(null);
    setModalFormData(null);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'monospace, sans-serif', position: 'relative' }}>
      
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
              placeholder="Start typing a video game name..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              style={{ width: '100%', padding: '16px 50px 16px 25px', borderRadius: '40px', border: 'none', backgroundColor: '#98B910', fontWeight: 'bold', fontSize: '18px', outline: 'none', color: '#143910' }} 
            />
            <img src={searchIcon} alt="Search Status" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '28px' }} />
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '50px' }}>
          <div style={{ borderBottom: '3px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '36px', color: '#143910', margin: 0 }}>Global Game Database Search</h1>
            <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Results update dynamically as you type.</p>
          </div>

          {loading && <h3 style={{ color: '#143910' }}>Searching...</h3>}

          {!loading && results.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px' }}>
              {results.map((game) => (
                <div key={game.id} style={{ border: '2px dashed #98B910', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: '#f8fafc', height: '320px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100px', height: '100px', backgroundColor: game.mockColor || '#cbd5e1', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid #cbd5e1', fontSize: '20px' }}>🎮</div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#143910', fontSize: '16px', fontWeight: 'bold' }}>{game.title}</h4>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{game.platform} • {game.year}</span>
                  </div>
                  <button onClick={() => openAddModal(game)} style={{ backgroundColor: '#143910', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%' }}>
                      Edit
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <p style={{ color: '#64748b' }}>No live matches found for your current search term.</p>
          )}
        </div>
      </div>

      {/* MODAL*/}
      <GameDetailsModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalFormData(null);
        }}
        onSubmit={handleSaveEntry}
        gameData={modalFormData}
        setGameData={setModalFormData}
        showListAssignment={true}
      />
    </div>
  );
};

export default GameSearchPage;