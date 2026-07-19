import React from 'react';

export default function ListCard({ listName }) {
  return (
    <div style={{ 
      border: '1px solid #E5E7EB', 
      borderRadius: '8px', 
      padding: '16px', 
      minWidth: '240px',
      backgroundColor: '#FFFFFF',
      flexShrink: 0
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '8px', 
        marginBottom: '16px' 
      }}>
        {[1, 2, 3, 4].map(num => (
          <div key={num} style={{ 
            backgroundColor: '#EBE5F0', 
            height: '80px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#B0A8B9', opacity: 0.5, borderRadius: '2px' }}></div>
          </div>
        ))}
      </div>
      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
        {listName}
      </h4>
    </div>
  );
}