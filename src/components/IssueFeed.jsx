import { useState } from 'react';
import useIssues from '../hooks/useIssues';
import IssueCard from './IssueCard';
import IssueModal from './IssueModal';

export default function IssueFeed() {
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
        Loading issues…
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No issues reported yet. Be the first to report one!
      </div>
    );
  }

  let sortedIssues = issues;
  if (sortMode === 'most_upvoted') {
    sortedIssues = [...issues].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  }

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 bg-slate-100 p-1 rounded-lg self-start">
        <button 
          onClick={() => setSortMode('recent')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortMode === 'recent' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Recent
        </button>
        <button 
          onClick={() => setSortMode('most_upvoted')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortMode === 'most_upvoted' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Most Upvoted
        </button>
      </div>

      <div className="flex flex-col gap-3 pb-20">
        {sortedIssues.map(issue => (
          <IssueCard key={issue.id} issue={issue} onSelect={selectIssue} />
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
