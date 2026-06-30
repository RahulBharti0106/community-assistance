import { useState } from 'react';
import IssueMap from './components/IssueMap.jsx';
import ReportForm from './components/ReportForm.jsx';
import IssueFeed from './components/IssueFeed.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('map');
  const [flyToIssue, setFlyToIssue] = useState(null);

  const navItems = [
    {
      id: 'map',
      label: 'Map',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      )
    },
    {
      id: 'report',
      label: 'Report',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
          <circle cx="12" cy="13" r="3"></circle>
        </svg>
      )
    },
    {
      id: 'feed',
      label: 'Feed',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      )
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-[var(--ch-paper)]">
      <header className="text-sm font-semibold tracking-tight text-[var(--ch-ink)] px-4 py-3 border-b border-[var(--ch-border)] bg-[var(--ch-surface)] flex-shrink-0">
        Community Hero
      </header>
      <div className="flex-grow overflow-auto">
        {activeScreen === 'map' && (
          <IssueMap 
            flyToIssue={flyToIssue} 
            onFlyComplete={() => setFlyToIssue(null)} 
          />
        )}
        {activeScreen === 'report' && <ReportForm />}
        {activeScreen === 'feed' && (
          <IssueFeed 
            onShowOnMap={(issue) => {
              setFlyToIssue(issue);
              setActiveScreen('map');
            }} 
          />
        )}
        {activeScreen === 'dashboard' && <Dashboard />}
      </div>
      <nav className="flex justify-around bg-[var(--ch-surface)] border-t border-[var(--ch-border)] p-2 pb-6 flex-shrink-0">
        {navItems.map(item => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center gap-1 flex-1 py-2 relative transition-colors ${
                isActive ? 'text-[var(--ch-accent)]' : 'text-[var(--ch-ink)] opacity-50 hover:opacity-75'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--ch-accent)] rounded-b" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
