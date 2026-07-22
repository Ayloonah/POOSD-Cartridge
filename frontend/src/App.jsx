import React from 'react';
import { AuthProvider } from './context/AuthContext';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListView from './pages/ListView';
import GameSearchPage from './pages/GameSearchPage';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/dashboard" element={<HomePage />} />
          
          <Route path="/search" element={<GameSearchPage />} />
          <Route path="/lists" element={<ListView />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}