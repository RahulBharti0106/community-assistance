function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function IssueCard({ issue, onSelect }) {
  const statusColorVar = `var(--ch-${issue.status === 'resolved' ? 'resolved' : issue.severity})`;

  return (
    <div 
      onClick={() => onSelect(issue)}
      className="flex gap-3 p-4 bg-[var(--ch-surface)] border border-[var(--ch-border)] border-l-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
      style={{ borderLeftColor: statusColorVar }}
    >
      {issue.image_url && (
        <img src={issue.image_url} alt={issue.title} className="w-16 h-16 rounded object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-[var(--ch-ink)] truncate text-sm">{issue.title}</h3>
          <div className="flex gap-2 items-center mt-1">
            <span className="text-[10px] font-medium bg-slate-100 text-[var(--ch-ink)] px-1.5 py-0.5 rounded uppercase">
              {issue.category?.replace('_', ' ')}
            </span>
            <span 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: statusColorVar }}
            ></span>
          </div>
        </div>
        <div className="text-xs text-slate-500 truncate mt-1">
          {issue.address || 'Unknown location'}
        </div>
      </div>
      <div className="flex flex-col items-end justify-between text-xs text-slate-500 flex-shrink-0">
        <div className="bg-slate-100 px-2 py-1 rounded text-[var(--ch-ink)] font-medium tabular-nums">
          👍 {issue.upvotes || 0}
        </div>
        <div className="tabular-nums">
          {timeAgo(issue.created_at)}
        </div>
      </div>
    </div>
  );
}
