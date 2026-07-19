import React from 'react';

export default function GameCard({ title, platform, rating, hoursPlayed }) {
  
    const renderStars = (ratingCount) => {
    return "★".repeat(ratingCount) + "☆".repeat(5 - ratingCount);
  };

  return (
    <div style={{ 
      border: '1px solid #E5E7EB', 
      borderRadius: '8px', 
      padding: '16px', 
      minWidth: '200px',
      backgroundColor: '#FFFFFF',
      flexShrink: 0
    }}>
      <div style={{ 
        backgroundColor: '#EBE5F0', 
        height: '220px', 
        borderRadius: '16px', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px', opacity: 0.5 }}>
          <div style={{ width: '30px', height: '30px', backgroundColor: '#B0A8B9', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
          <div style={{ width: '30px', height: '30px', backgroundColor: '#B0A8B9', borderRadius: '4px' }}></div>
        </div>
      </div>

      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
        {title}
      </h4>

      
      {rating > 0 ? (
        <>
          <div style={{ color: '#111827', marginBottom: '4px', fontSize: '14px', letterSpacing: '2px' }}>
            {renderStars(rating)}
          </div>
          <div style={{ fontSize: '12px', color: '#4B5563' }}>
            {platform} • {hoursPlayed} hrs
          </div>
        </>
      ) : (
        <>
          <div style={{ color: '#143910', marginBottom: '4px', fontSize: '12px', fontWeight: '600' }}>
            Not rated yet.
          </div>
          <div style={{ fontSize: '12px', color: '#4B5563' }}>
            {platform}
          </div>
        </>
      )}
    </div>
  );
}