import { useState } from 'react';
import IssueMap from './components/IssueMap.jsx';
import ReportForm from './components/ReportForm.jsx';
import IssueFeed from './components/IssueFeed.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('map');

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-auto">
        {activeScreen === 'map' && <IssueMap />}
        {activeScreen === 'report' && <ReportForm />}
        {activeScreen === 'feed' && <IssueFeed />}
        {activeScreen === 'dashboard' && <Dashboard />}
      </div>
      <nav className="flex justify-around bg-white border-t p-4 pb-6">
        <button onClick={() => setActiveScreen('map')} className={activeScreen === 'map' ? 'font-bold' : ''}>Map</button>
        <button onClick={() => setActiveScreen('report')} className={activeScreen === 'report' ? 'font-bold' : ''}>Report</button>
        <button onClick={() => setActiveScreen('feed')} className={activeScreen === 'feed' ? 'font-bold' : ''}>Feed</button>
        <button onClick={() => setActiveScreen('dashboard')} className={activeScreen === 'dashboard' ? 'font-bold' : ''}>Dashboard</button>
      </nav>
    </div>
  );
}
