import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import GameCard from '../components/GameCard';
import ListCard from '../components/ListCard';
import Button from '../components/Button';
import AddGameModal from '../components/AddGameModal';

export default function HomePage() {

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <DashboardLayout>
      
  
      <AddGameModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="font-vt323" style={{ fontSize: '32px', color: '#143910', letterSpacing: '2px' }}>
            Recently Added
          </h2>

          <Button 
            variant="primary" 
            style={{ padding: '8px 16px', borderRadius: '4px' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Game
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px' }}>
          <GameCard title="Hollow Knight" platform="PC" rating={5} hoursPlayed={45} />
          <GameCard title="Elden Ring" platform="PlayStation 5" rating={0} hoursPlayed={0} />
          <GameCard title="Stardew Valley" platform="Nintendo Switch" rating={4} hoursPlayed={120} />
          <GameCard title="Cyberpunk 2077" platform="PC" rating={0} hoursPlayed={0} />
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="font-vt323" style={{ fontSize: '32px', color: '#143910', letterSpacing: '2px' }}>
            My Lists
          </h2>
          <Button variant="primary" style={{ padding: '8px 16px', borderRadius: '4px' }}>+ New List</Button>
        </div>

        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px' }}>
          <ListCard listName="Current Backlog" />
          <ListCard listName="Favorites of 2024" />
          <ListCard listName="Played" />
          <ListCard listName="Co-op with Friends" />
          <ListCard listName="Wishlist" />


        </div>
      </section>

    </DashboardLayout>
  );
}