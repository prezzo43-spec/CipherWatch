import React from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Sidebar />
      <TopBar />
      <Dashboard />
    </div>
  );
}

export default App;
