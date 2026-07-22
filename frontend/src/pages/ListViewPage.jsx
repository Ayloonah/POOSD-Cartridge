import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/Button';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';

export default function ListViewPage() {
  const { token } = useContext(AuthContext);
  const currentToken = token || localStorage.getItem('token');
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [userEntries, setUserEntries] = useState([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentToken) {
      api.get('/user-game-entries/collection', currentToken)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Sort collection entries from newest to oldest by creation date
            const sortedEntries = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setUserEntries(sortedEntries);
          } else {
            setUserEntries([]);
          }
        })
        .catch(err => {
          console.error("Failed to load collection games", err);
          setError("Failed to load games from your collection.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [currentToken]);

  // Use the 4 latest games added out of the selected ones for the cover collage
  const getLatestCoverImages = () => {
    const selectedEntries = userEntries.filter(entry => selectedEntryIds.includes(entry._id));
    
    // Sort selected entries by newest createdAt date to get the 4 latest
    const sortedSelected = [...selectedEntries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return sortedSelected
      .map(entry => {
        const gameObj = entry.gameId || entry;
        return gameObj.coverImage || entry.coverImage;
      })
      .filter(Boolean)
      .slice(0, 4);
  };

  const selectedCovers = getLatestCoverImages();

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        name: name.trim(),
        isPublic: false,
        coverImage: selectedCovers.length > 0 ? selectedCovers[0] : null,
        entryIds: selectedEntryIds
      };

      const res = await api.post('/lists', payload, currentToken);
      const resData = await res.json();

      if (res.ok) {
        navigate('/lists'); 
      } else {
        setError(resData.error || "Failed to create list.");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '48px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', color: '#143910', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ← Back
          </button>
          <h2 className="font-vt323" style={{ fontSize: '36px', color: '#143910', margin: 0, letterSpacing: '1px' }}>
            Create New List
          </h2>
        </div>

        {error && <div style={{ color: '#DC2626', marginBottom: '16px', fontWeight: '600' }}>{error}</div>}

        <form onSubmit={handleCreateList} style={{ display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '4px solid #143910' }}>
          
          {/* List Name Input */}
          <div>
            <label style={{ fontWeight: '700', color: '#143910', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              List Name *
            </label>
            <input 
              type="text" 
              placeholder="e.g. Favorite RPGs of All Time" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #143910', fontFamily: 'Inter', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} 
              autoFocus
              required
            />
          </div>

          {/* Cover Preview Section (4 latest games) */}
          <div>
            <label style={{ fontWeight: '700', color: '#143910', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Cover Preview (4 Latest Games Collage)
            </label>
            <div style={{
              width: '100%', height: '140px', backgroundColor: '#EBE5F0', borderRadius: '8px', border: '2px solid #143910',
              display: 'grid', gridTemplateColumns: selectedCovers.length > 1 ? 'repeat(2, 1fr)' : '1fr', gridTemplateRows: selectedCovers.length > 2 ? 'repeat(2, 1fr)' : '1fr',
              overflow: 'hidden', gap: '2px', padding: '2px', boxSizing: 'border-box'
            }}>
              {selectedCovers.length > 0 ? (
                selectedCovers.map((imgUrl, idx) => (
                  <img key={idx} src={imgUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ))
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6B7280', fontSize: '14px', fontStyle: 'italic', gridColumn: '1 / -1', gridRow: '1 / -1' }}>
                  Select games from your collection below to generate cover
                </div>
              )}
            </div>
          </div>

          {/* Collection Games Selector */}
          <div>
            <label style={{ fontWeight: '700', color: '#143910', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Add Games from Collection
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '8px', border: '2px solid #143910', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
              {isLoading ? (
                <span style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', padding: '16px' }}>Loading collection...</span>
              ) : userEntries.length === 0 ? (
                <span style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', padding: '16px' }}>No games in your collection yet.</span>
              ) : (
                userEntries.map(entry => {
                  const gameObj = entry.gameId || entry;
                  const gameTitle = gameObj.name || entry.name || 'Unknown Game';
                  const entryId = entry._id;
                  const isChecked = selectedEntryIds.includes(entryId);

                  return (
                    <label key={entryId} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: '#111827', padding: '4px 0' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEntryIds([...selectedEntryIds, entryId]);
                          } else {
                            setSelectedEntryIds(selectedEntryIds.filter(id => id !== entryId));
                          }
                        }}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                      {gameTitle}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="tertiary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create List'}
            </Button>
          </div>

        </form>

      </div>
    </DashboardLayout>
  );
}