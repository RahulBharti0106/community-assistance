export default function IssueModal({ issue, onClose, onUpvote, onStatusChange }) {
  if (!issue) return null;

  const statusColorVar = `var(--ch-${issue.status === 'resolved' ? 'resolved' : issue.severity})`;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[9999] p-4 flex items-start justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-w-lg w-full mt-8 bg-[var(--ch-surface)] rounded-xl overflow-y-auto max-h-[90vh] p-4 shadow-xl flex flex-col gap-4">
        
        <div 
          className="flex justify-between items-start border-l-4 pl-3 -ml-4"
          style={{ borderLeftColor: statusColorVar }}
        >
          <h2 className="text-xl font-bold text-[var(--ch-ink)] tracking-tight ml-1">{issue.title}</h2>
          <button onClick={onClose} className="text-[var(--ch-ink)] opacity-50 hover:opacity-100 p-1">
            ✕
          </button>
        </div>

        {issue.image_url ? (
          <img src={issue.image_url} alt={issue.title} className="w-full max-h-[200px] object-cover rounded-xl" />
        ) : (
          <div className="w-full h-[200px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
            No photo
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs font-semibold tracking-wide uppercase">
          <span 
            className="px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: `var(--ch-${issue.severity})` }}
          >
            {issue.severity}
          </span>
          <span className="px-2 py-1 rounded-full bg-slate-100 text-[var(--ch-ink)] border border-[var(--ch-border)]">
            {issue.category?.replace('_', ' ')}
          </span>
          <span 
            className="px-2 py-1 rounded-full text-white"
            style={{ 
              backgroundColor: issue.status === 'resolved' ? 'var(--ch-resolved)' :
                issue.status === 'verified' ? 'var(--ch-accent)' :
                issue.status === 'in_progress' ? 'var(--ch-moderate)' : 'var(--ch-ink)'
            }}
          >
            {issue.status?.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-4 mt-2 text-sm leading-relaxed">
          <div>
            <div className="font-semibold text-[var(--ch-ink)] text-xs uppercase tracking-wide mb-1">Description</div>
            <div className="text-[var(--ch-ink)]">{issue.description || 'No description provided.'}</div>
          </div>
          {issue.urgency_reason && (
            <div>
              <div className="font-semibold text-[var(--ch-ink)] text-xs uppercase tracking-wide mb-1">Why this severity</div>
              <div className="text-[var(--ch-ink)]">{issue.urgency_reason}</div>
            </div>
          )}
          {issue.action_recommendation && (
            <div>
              <div className="font-semibold text-[var(--ch-ink)] text-xs uppercase tracking-wide mb-1">Recommended action</div>
              <div className="text-[var(--ch-ink)]">{issue.action_recommendation}</div>
            </div>
          )}
        </div>

        <div className="text-sm text-[var(--ch-ink)] flex items-start gap-2 mt-2">
          <span>📍</span>
          <span>{issue.address || 'Location unknown'}</span>
        </div>

        <div className="text-xs text-[var(--ch-ink)] opacity-60 tabular-nums">
          Reported: {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        <button 
          onClick={() => onUpvote(issue.id)}
          className="w-full mt-2 border border-[var(--ch-accent)] text-[var(--ch-accent)] hover:bg-[var(--ch-accent)] hover:text-white font-medium py-2.5 rounded-xl transition-colors tabular-nums"
        >
          👍 I see this too ({issue.upvotes || 0})
        </button>

        <div className="mt-4 pt-4 border-t border-[var(--ch-border)]">
          <div className="text-xs font-semibold text-[var(--ch-ink)] uppercase tracking-wide mb-3">Update status</div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'reported', label: 'Reported' },
              { id: 'verified', label: 'Verified' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => onStatusChange(issue.id, status.id)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-lg transition-colors border ${
                  issue.status === status.id
                    ? 'bg-[var(--ch-ink)] text-white border-[var(--ch-ink)]'
                    : 'bg-transparent text-[var(--ch-ink)] border-[var(--ch-border)] hover:bg-slate-50'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
