import React, { useState, useEffect } from 'react';
import Button from './Button';
import searchIcon from '../assets/Search.svg'; 

export default function AddGameModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [rating, setRating] = useState(0);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery('');
      setSelectedGame(null);
      setRating(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Dummy data to simulate the RAWG API until Phase 2
  const dummyResults = [
    { id: 1, title: 'Hollow Knight', developer: 'Team Cherry', year: 2017 },
    { id: 2, title: 'Hades', developer: 'Supergiant Games', year: 2020 },
    { id: 3, title: 'Celeste', developer: 'Extremely OK Games', year: 2018 },
  ].filter(game => game.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setStep(2);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '32px',
        width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        
        {step === 1 && (
          <div>
            <h2 className="font-vt323" style={{ fontSize: '32px', color: '#143910', marginBottom: '24px', letterSpacing: '1px' }}>
              Add Game
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
              <img 
                            src={searchIcon} 
                            alt="Search" 
                            style={{ width: '20px', height: '20px', marginRight: '8px' }} 
                          />
              <input 
                type="text" 
                placeholder="Search for a game..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', backgroundColor: 'transparent', width: '100%', outline: 'none', fontFamily: 'Inter', fontSize: '16px' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchQuery.length > 0 && dummyResults.map(game => (
                <div 
                  key={game.id} 
                  onClick={() => handleGameSelect(game)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' 
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{game.title}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{game.developer} • {game.year}</div>
                  </div>
                  <div style={{ color: '#98B910', fontWeight: 'bold' }}>&gt;</div>
                </div>
              ))}
              {searchQuery.length > 0 && dummyResults.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>No games found.</div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button variant="tertiary" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        )}

        {step === 2 && selectedGame && (
          <div>
            <button 
              onClick={() => setStep(1)} 
              style={{ color: '#4B5563', fontSize: '14px', marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              ← Change Game
            </button>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '110px', backgroundColor: '#EBE5F0', borderRadius: '8px', flexShrink: 0 }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{selectedGame.title}</h3>
                <span style={{ color: '#6B7280', fontSize: '14px' }}>{selectedGame.developer}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              
              <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Played</label>
              <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />

              <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Platform</label>
              <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'Inter', outline: 'none' }}>
                <option>Select platform...</option>
                <option>PC</option>
                <option>PlayStation 5</option>
                <option>Nintendo Switch</option>
                <option>Xbox Series X</option>
              </select>

              <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Hours Played</label>
              <input type="number" min="0" placeholder="0" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'Inter', outline: 'none', width: '80px' }} />

              <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Rating</label>
              <div style={{ display: 'flex', gap: '4px', fontSize: '24px', color: '#111827', letterSpacing: '2px', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} onClick={() => setRating(star)}>
                    {star <= rating ? '★' : '☆'}
                  </span>
                ))}
              </div>

              <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>List</label>
              <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'Inter', outline: 'none' }}>
                <option>None</option>
                <option>Current Backlog</option>
                <option>Favorites</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              <label style={{ fontWeight: '600', color: '#4B5563', fontSize: '14px' }}>Review</label>
              <textarea 
                rows="4" 
                placeholder="Write your thoughts here..." 
                style={{ padding: '12px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'Inter', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="tertiary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                console.log("Saving game data...");
                onClose();
              }}>Save Game</Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}