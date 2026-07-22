import React, { useState, useEffect, useRef } from 'react';
import logo from '../assets/Menu & Fab.png';

const ProfileSettingsPage = () => {

  // User state
  const [initialUsername, setInitialUsername] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Security fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Statuses
  const [pendingEmail, setPendingEmail] = useState(null);
  const [usernameStatus, setUsernameStatus] = useState('');
  const [statusBanner, setStatusBanner] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Ref to store debounce timer for username lookup
  const debounceTimer = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Fetch active user profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://www.cartridgeapp.fun/api/auth/me', {
          headers: { ...getAuthHeader() }
        });
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username || '');
          setInitialUsername(data.username || '');
          setEmail(data.email || '');
          setPendingEmail(data.pendingEmail || null);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Real-time Database Username Check with Debouncing
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    // Clear previous pending timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setUsernameStatus('');
      return;
    }

    // Don't flag current username as unavailable
    if (value.trim().toLowerCase() === initialUsername.toLowerCase()) {
      setUsernameStatus('');
      return;
    }

    setUsernameStatus('Checking availability...');

    // Debounce network request by 350ms
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`http://www.cartridgeapp.fun/api/auth/checkUsername?username=${encodeURIComponent(value)}`, {
          headers: { ...getAuthHeader() }
        });
        const data = await response.json();
        
        if (data.available) {
          setUsernameStatus('✓ Username is available');
        } else {
          setUsernameStatus('❌ Username is already taken');
        }
      } catch (err) {
        setUsernameStatus('');
      }
    }, 350);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setStatusBanner({ type: '', text: '' });

    if (usernameStatus.includes('❌')) {
      setStatusBanner({ type: 'error', text: 'Please choose an available username before saving.' });
      return;
    }

    const payload = { username, email };

    if (newPassword) {
      if (!currentPassword) {
        setStatusBanner({ type: 'error', text: 'Current password is required to set a new password.' });
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      setIsSaving(true);
      const response = await fetch('http://www.cartridgeapp.fun/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setStatusBanner({ type: 'success', text: 'Settings updated successfully!' });
        setInitialUsername(username);
        setUsernameStatus('');
        setCurrentPassword('');
        setNewPassword('');

        // SendGrid email re-verification trigger check
        if (data.pendingEmail) {
          setPendingEmail(data.pendingEmail);
        } else if (data.email) {
          setEmail(data.email);
          setPendingEmail(null);
        }
      } else {
        setStatusBanner({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setStatusBanner({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://www.cartridgeapp.fun/api/auth/logout', {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('WARNING: Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch('http://www.cartridgeapp.fun/api/auth/account', {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });

      if (response.ok) {
        alert('Account deleted successfully.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        const data = await response.json();
        alert(data.message || 'Could not process deletion request at this time.');
      }
    } catch (err) {
      console.error("Account elimination failure:", err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar Navigation */}
      <div style={{ width: '260px', minWidth: '260px', backgroundColor: '#787878', display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
        <div style={{ padding: '30px', display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="Cartridge Logo" style={{ width: '160px', height: 'auto' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '25px' }}>
          {[
            { label: 'Home', path: '/dashboard' },
            { label: 'Collection', path: '/collection' },
            { label: 'Settings', path: '/settings' }
          ].map((item) => (
            <button 
              key={item.label} 
              onClick={() => { window.location.href = item.path; }}
              style={{ 
                padding: '16px 20px', 
                backgroundColor: item.label === 'Settings' ? '#98B910' : 'transparent', 
                border: 'none', 
                color: item.label === 'Settings' ? '#143910' : '#fff', 
                textAlign: 'left', 
                borderRadius: '30px', 
                fontWeight: 'bold', 
                fontSize: '18px', 
                cursor: 'pointer' 
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* SendGrid Re-verification Banner */}
        {pendingEmail && (
          <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '14px 30px', fontSize: '14px', fontWeight: '500', borderBottom: '1px solid #fde68a' }}>
            ⚠️ Verification pending for <strong>{pendingEmail}</strong>. Please check your inbox to confirm your new email. You can continue using the app in the meantime.
          </div>
        )}

        {/* Content Body - Centered with margin: 0 auto */}
        <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto', padding: '50px 30px', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '32px', color: '#143910', margin: '0 0 40px 0', fontWeight: '700' }}>Account Settings</h1>
          
          {statusBanner.text && (
            <div style={{ padding: '14px 18px', borderRadius: '8px', marginBottom: '30px', fontWeight: '500', backgroundColor: statusBanner.type === 'success' ? '#d1fae5' : '#fee2e2', color: statusBanner.type === 'success' ? '#065f46' : '#991b1b' }}>
              {statusBanner.type === 'success' ? '✓ ' : '❌ '}{statusBanner.text}
            </div>
          )}
          
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Initial Avatar Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '30px' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#143910', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                {username ? username.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '20px' }}>
                  {username || 'User Profile'}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Default avatar based on username initial</span>
              </div>
            </div>

            {/* Username Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={handleUsernameChange}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
              />
              {usernameStatus && (
                <span style={{ fontSize: '13px', fontWeight: '500', color: usernameStatus.includes('❌') ? '#ef4444' : usernameStatus.includes('✓') ? '#10b981' : '#64748b' }}>
                  {usernameStatus}
                </span>
              )}
            </div>

            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Password Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Change Password</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Current Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>New Password</label>
                <input 
                  type="password" 
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '30px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button 
                type="submit" 
                disabled={isSaving}
                style={{ padding: '12px 28px', backgroundColor: '#143910', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>

              <button 
                type="button" 
                onClick={handleLogout} 
                style={{ padding: '12px 24px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}
              >
                Logout
              </button>

              <button 
                type="button" 
                onClick={handleDeleteAccount} 
                style={{ padding: '12px 24px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginLeft: 'auto' }}
              >
                Delete Account
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default ProfileSettingsPage;