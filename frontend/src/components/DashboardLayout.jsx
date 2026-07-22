import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import profileIcon from '../assets/Generic avatar.svg'; 
import { AuthContext } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close the dropdown if the user clicks anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      // Fallback in case logout isn't explicitly defined in context yet
      localStorage.removeItem('token'); 
    }
    navigate('/'); // Kick the user back to the landing page
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '80px', backgroundColor: '#143910', display: 'flex', alignItems: 'center', padding: '0 40px', justifyContent: 'flex-end', flexShrink: 0 }}>
          
          {/* Profile Wrapper with Ref for the click-outside listener */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ width: '40px', height: '40px', backgroundColor: '#98B910', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', overflow: 'hidden' }}
            >
              <img 
                src={profileIcon} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div style={{ 
                position: 'absolute', 
                top: '56px', 
                right: 0, 
                backgroundColor: '#FFFFFF', 
                border: '2px solid #98B910', 
                borderRadius: '8px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)', 
                overflow: 'hidden',
                zIndex: 100,
                width: '160px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <button 
                  onClick={() => navigate('/profile')}
                  style={{ padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #E5E7EB', cursor: 'pointer', fontSize: '16px', color: '#143910', fontWeight: '600', fontFamily: 'Inter' }}
                >
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  style={{ padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#ff4d4d', fontWeight: '600', fontFamily: 'Inter' }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

        </header>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}