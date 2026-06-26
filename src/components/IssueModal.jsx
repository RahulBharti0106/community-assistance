export default function IssueModal({ issue, onClose, onUpvote, onStatusChange }) {
  if (!issue) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[9999] p-4 flex items-start justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-w-lg w-full mt-8 bg-white rounded-2xl overflow-y-auto max-h-[90vh] p-4 shadow-xl flex flex-col gap-4">
        
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-slate-800">{issue.title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1">
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

        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className={`px-2 py-1 rounded-full text-white capitalize ${issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'moderate' ? 'bg-amber-500' : 'bg-green-500'}`}>
            {issue.severity}
          </span>
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize border border-slate-200">
            {issue.category?.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-white capitalize ${
            issue.status === 'reported' ? 'bg-slate-500' :
            issue.status === 'verified' ? 'bg-blue-500' :
            issue.status === 'in_progress' ? 'bg-amber-500' :
            issue.status === 'resolved' ? 'bg-green-500' : 'bg-slate-500'
          }`}>
            {issue.status?.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-3 mt-2 text-sm">
          <div>
            <div className="font-semibold text-slate-700">Description</div>
            <div className="text-slate-600">{issue.description || 'No description provided.'}</div>
          </div>
          {issue.urgency_reason && (
            <div>
              <div className="font-semibold text-slate-700">Why this severity</div>
              <div className="text-slate-600">{issue.urgency_reason}</div>
            </div>
          )}
          {issue.action_recommendation && (
            <div>
              <div className="font-semibold text-slate-700">Recommended action</div>
              <div className="text-slate-600">{issue.action_recommendation}</div>
            </div>
          )}
        </div>

        <div className="text-sm text-slate-600 flex items-start gap-2 mt-2">
          <span>📍</span>
          <span>{issue.address || 'Location unknown'}</span>
        </div>

        <div className="text-xs text-slate-500">
          Reported: {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        <button 
          onClick={() => onUpvote(issue.id)}
          className="w-full mt-2 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium py-2.5 rounded-xl transition-colors"
        >
          👍 I see this too ({issue.upvotes || 0})
        </button>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-sm font-semibold text-slate-700 mb-2">Update status:</div>
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  issue.status === status.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
