import React, { useState, useEffect, useContext } from 'react';
import Button from './Button';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';

export default function CreateListModal({ 
  isOpen, 
  onClose, 
  onListCreated, 
  onOpenAddGameModal, 
  prefilledName = '', 
  prefilledSelectedIds = [],
  onStateChange 
}) {
  const { token } = useContext(AuthContext);
  const currentToken = token || localStorage.getItem('token');

  const [name, setName] = useState(prefilledName);
  const [userEntries, setUserEntries] = useState([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState(prefilledSelectedIds);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync internal state if parent passes updated prefilled data (e.g. returning from adding a game)
  useEffect(() => {
    if (isOpen) {
      setName(prefilledName);
      setSelectedEntryIds(prefilledSelectedIds);
      setIsLoading(true);

      api.get('/user-game-entries/collection', currentToken)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUserEntries(data);
          } else {
            setUserEntries([]);
          }
        })
        .catch(err => {
          console.error("Failed to load collection games for list creation", err);
          setUserEntries([]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentToken, prefilledName, prefilledSelectedIds]);

  if (!isOpen) return null;

  const getSelectedCoverImages = () => {
    return userEntries
      .filter(entry => selectedEntryIds.includes(entry._id))
      .map(entry => {
        const gameObj = entry.gameId || entry;
        return gameObj.coverImage || entry.coverImage;
      })
      .filter(Boolean)
      .slice(0, 4);
  };

  const selectedCovers = getSelectedCoverImages();

  const handleCreateList = async () => {
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        isPublic: false,
        coverImage: selectedCovers.length > 0 ? selectedCovers[0] : null,
        entryIds: selectedEntryIds
      };

      const res = await api.post('/lists', payload, currentToken);
      const resData = await res.json();

      if (res.ok) {
        if (onListCreated) onListCreated(resData.list);
        onClose();
      } else {
        alert(resData.error || "Failed to create list.");
      }
    } catch (error) {
      alert(`Error creating list: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 120
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', width: '100%', maxWidth: '480px', maxHeight: '90vh',
        borderRadius: '16px', border: '4px solid #143910', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden'
      }}>
        
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E5E7EB' }}>
          <h3 className="font-vt323" style={{ fontSize: '26px', color: '#143910', margin: 0 }}>Create New List</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', fontWeight: 'bold', color: '#143910', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ fontWeight: '700', color: '#143910', fontSize: '13px', display: 'block', marginBottom: '4px' }}>List Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Favorite RPGs" 
              value={name} 
              onChange={(e) => {
                setName(e.target.value);
                if (onStateChange) onStateChange(e.target.value, selectedEntryIds);
              }} 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '2px solid #143910', fontFamily: 'Inter', outline: 'none', boxSizing: 'border-box' }} 
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontWeight: '700', color: '#143910', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Cover Preview (Auto-generated)</label>
            <div style={{
              width: '100%', height: '110px', backgroundColor: '#EBE5F0', borderRadius: '8px', border: '2px solid #143910',
              display: 'grid', gridTemplateColumns: selectedCovers.length > 1 ? 'repeat(2, 1fr)' : '1fr', gridTemplateRows: selectedCovers.length > 2 ? 'repeat(2, 1fr)' : '1fr',
              overflow: 'hidden', gap: '2px', padding: '2px', boxSizing: 'border-box'
            }}>
              {selectedCovers.length > 0 ? (
                selectedCovers.map((imgUrl, idx) => (
                  <img key={idx} src={imgUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ))
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6B7280', fontSize: '13px', fontStyle: 'italic', gridColumn: '1 / -1', gridRow: '1 / -1' }}>
                  Select games below to generate cover
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: '700', color: '#143910', fontSize: '13px' }}>Add Games from Collection</label>
              <button 
                type="button"
                onClick={() => {
                  // Save state snapshot and trigger opening the Add Game modal
                  if (onOpenAddGameModal) onOpenAddGameModal();
                }}
                style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
              >
                + Add game to collection
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', borderRadius: '6px', border: '2px solid #143910', maxHeight: '140px', overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
              {isLoading ? (
                <span style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '10px' }}>Loading collection...</span>
              ) : userEntries.length === 0 ? (
                <span style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '10px' }}>No games in your collection yet.</span>
              ) : (
                userEntries.map(entry => {
                  const gameObj = entry.gameId || entry;
                  const gameTitle = gameObj.name || entry.name || 'Unknown Game';
                  const entryId = entry._id;
                  const isChecked = selectedEntryIds.includes(entryId);

                  return (
                    <label key={entryId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#111827' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={(e) => {
                          let updatedIds;
                          if (e.target.checked) {
                            updatedIds = [...selectedEntryIds, entryId];
                          } else {
                            updatedIds = selectedEntryIds.filter(id => id !== entryId);
                          }
                          setSelectedEntryIds(updatedIds);
                          if (onStateChange) onStateChange(name, updatedIds);
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      {gameTitle}
                    </label>
                  );
                })
              )}
            </div>
          </div>

        </div>

        <div style={{ padding: '16px 32px', backgroundColor: '#F9FAFB', borderTop: '2px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateList} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create List'}
          </Button>
        </div>

      </div>
    </div>
  );
}