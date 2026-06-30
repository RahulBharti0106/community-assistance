import { useState } from 'react';
import useIssues from '../hooks/useIssues';
import IssueCard from './IssueCard';
import IssueModal from './IssueModal';

export default function IssueFeed({ onShowOnMap }) {
  const {
    issues,
    loading,
    selectedIssue,
    selectIssue,
    clearSelectedIssue,
    upvoteIssue,
    updateIssueStatus
  } = useIssues();

  const [sortMode, setSortMode] = useState('recent');

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading reported issues…
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--ch-ink)] opacity-30 mb-4">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <h3 className="font-bold text-[var(--ch-ink)] text-lg mb-1">No issues yet</h3>
        <p className="text-slate-500 text-sm">Report a problem in your area to get started.</p>
      </div>
    );
  }

  let sortedIssues = issues;
  if (sortMode === 'most_upvoted') {
    sortedIssues = [...issues].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  }

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col h-full space-y-6">
      <div className="flex items-center gap-6 border-b border-[var(--ch-border)]">
        <button 
          onClick={() => setSortMode('recent')}
          className={`pb-2 text-sm font-semibold transition-colors ${sortMode === 'recent' ? 'text-[var(--ch-accent)] border-b-2 border-[var(--ch-accent)]' : 'text-slate-500 hover:text-[var(--ch-ink)]'}`}
        >
          Recent
        </button>
        <button 
          onClick={() => setSortMode('most_upvoted')}
          className={`pb-2 text-sm font-semibold transition-colors ${sortMode === 'most_upvoted' ? 'text-[var(--ch-accent)] border-b-2 border-[var(--ch-accent)]' : 'text-slate-500 hover:text-[var(--ch-ink)]'}`}
        >
          Most Upvoted
        </button>
      </div>

      <div className="flex flex-col gap-4 pb-20">
        {sortedIssues.map(issue => (
          <div key={issue.id} className="flex flex-col gap-2">
            <IssueCard issue={issue} onSelect={selectIssue} />
            {issue.lat && issue.lng && (
              <div className="flex justify-end pr-1">
                <button
                  onClick={() => onShowOnMap(issue)}
                  className="text-xs font-semibold uppercase tracking-wide border border-[var(--ch-border)] text-[var(--ch-ink)] hover:text-[var(--ch-accent)] px-3 py-1.5 rounded-lg flex items-center gap-1.5 bg-[var(--ch-surface)] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Show on Map
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedIssue && (
        <IssueModal 
          issue={selectedIssue} 
          onClose={clearSelectedIssue} 
          onUpvote={upvoteIssue} 
          onStatusChange={updateIssueStatus} 
        />
      )}
    </div>
  );
}
