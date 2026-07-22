import React from 'react';
import { AuthProvider } from './context/AuthContext';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListView from './pages/ListView';
import GameSearchPage from './pages/GameSearchPage';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import VerifyEmail from './pages/VerifyEmail';


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/dashboard" element={<HomePage />} />
          
          <Route path="/collection" element={<GameSearchPage />} />
          <Route path="/lists" element={<ListView />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}