import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login } = useContext(AuthContext); 
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClose = () => {
    setError('');
    setSuccess('');
    setUsername('');
    setEmail('');
    setConfirmEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    onClose();
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log("Form State upon submit:", { 
      username, 
      email, 
      confirmEmail, 
      password, 
      confirmPassword 
    });

    try {
      if (isLoginMode) {
        // --- LOGIN LOGIC ---
        if (!email || !password) {
          throw new Error("Please fill out both email and password.");
        }
        
        const response = await api.post('/auth/login', { email, password });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed from backend.');
        }
        
        login(data.token, data.user.id, email);
        handleClose();
        navigate('/dashboard');

      } else {
        // --- REGISTER LOGIC ---
        if (!username || !email || !confirmEmail || !password || !confirmPassword) {
          throw new Error("Please fill out all 5 fields.");
        }
        if (email !== confirmEmail) {
          throw new Error("Emails do not match.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        // 8-14 chars, 1 uppercase, 1 number, 1 special
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;"'<>,.?/\\|`~]).{8,14}$/;
        if (!passwordRegex.test(password)) {
          throw new Error("Password must be 8-14 characters, with 1 uppercase letter, 1 number, and 1 special character.");
        }
        
        // Send to API
        const response = await api.post('/auth/register', { username, email, password, confirmPassword });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Backend rejected the registration.');
        }

        setSuccess('Account created! Please sign in.');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setConfirmEmail('');
      }
    } catch (err) {
      console.error("Auth Error:", err); 
      setError(err.message);
    }
  };

  const inputStyle = { padding: '12px', borderRadius: '8px', border: '2px solid #98B910', backgroundColor: '#E8F5E9', color: '#0F380F', width: '100%', boxSizing: 'border-box', fontWeight: 'bold' };
  const labelStyle = { color: '#FFFFFF', fontSize: '14px', marginBottom: '4px', display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: '#1b3b1a', padding: '32px', borderRadius: '12px', width: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {error && <div style={{ backgroundColor: '#ff4d4d', color: 'white', padding: '8px', borderRadius: '4px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ backgroundColor: '#98B910', color: '#143910', padding: '8px', borderRadius: '4px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLoginMode && (
            <div>
              <label style={labelStyle}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>

          {!isLoginMode && (
            <div>
              <label style={labelStyle}>Confirm Your Email</label>
              <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} style={inputStyle} />
            </div>
          )}

          <div>
            <label style={labelStyle}>Password</label>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            {!isLoginMode && <span style={{color: '#aaa', fontSize: '12px'}}>8-14 chars, 1 uppercase, 1 number, 1 special</span>}
          </div>

          {!isLoginMode && (
             <div>
               <label style={labelStyle}>Confirm Password</label>
               <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
             </div>
          )}

          <div>
            <label style={{ color: 'white', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
              Show Passwords
            </label>
          </div>
          
          <button type="submit" style={{ backgroundColor: '#e2e8f0', color: '#143910', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '8px' }}>
            {isLoginMode ? 'Sign In' : 'Register'}
          </button>
        </form>

        <button onClick={toggleMode} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', width: '100%', marginTop: '24px' }}>
          {isLoginMode ? 'Need an account? Register here →' : 'Already have an account? Sign in here →'}
        </button>

        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#8da825', width: '100%', marginTop: '16px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}