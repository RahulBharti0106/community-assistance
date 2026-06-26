import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import useDashboard from '../hooks/useDashboard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
  const {
    loading,
    aiLoading,
    aiError,
    metrics,
    categoryChartData,
    dailyChartData,
    topUpvoted,
    clusterInsight,
    rankedIssues
  } = useDashboard();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
      
      {/* Section 1: Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-2xl font-semibold text-slate-900">{metrics.total}</div>
          <div className="text-xs text-slate-500 mt-1">Total Issues</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-2xl font-semibold text-slate-900">{metrics.resolvedThisWeek}</div>
          <div className="text-xs text-slate-500 mt-1">Resolved This Week</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className={`text-2xl font-semibold ${metrics.criticalOpen > 0 ? 'text-red-500' : 'text-slate-900'}`}>
            {metrics.criticalOpen}
          </div>
          <div className="text-xs text-slate-500 mt-1">Critical Open</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-2xl font-semibold text-slate-900 truncate" title={metrics.mostActiveArea}>
            {metrics.mostActiveArea}
          </div>
          <div className="text-xs text-slate-500 mt-1">Most Active Area</div>
        </div>
      </div>

      {/* Section 2: AI Cluster Insight */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <span className="font-semibold text-sm text-emerald-900 uppercase tracking-wide">AI Pattern Detection</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">Gemini 2.5 Pro</span>
        </div>
        
        {aiLoading ? (
          <div className="animate-pulse bg-emerald-100/50 rounded h-12 w-full" />
        ) : aiError ? (
          <div className="text-sm text-amber-700">{aiError}</div>
        ) : clusterInsight ? (
          <div className="text-sm text-slate-700 leading-relaxed">{clusterInsight}</div>
        ) : (
          <div className="text-sm text-emerald-600/70">Not enough clustered data yet. More reports needed.</div>
        )}
      </div>

      {/* Section 3: AI Priority Ranking */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎯</span>
          <span className="font-bold text-slate-800">Top Priority Issues</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">AI Ranked</span>
        </div>
        
        {aiLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-slate-100 rounded h-16 w-full" />)}
          </div>
        ) : rankedIssues.length > 0 ? (
          <div className="space-y-4">
            {rankedIssues.map(item => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5
                  ${item.rank === 1 ? 'bg-red-500' : item.rank === 2 ? 'bg-amber-500' : 'bg-blue-500'}`}>
                  #{item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{item.issue.title}</h4>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.issue.severity === 'critical' ? 'bg-red-500' : item.issue.severity === 'moderate' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No open issues to rank.</div>
        )}
      </div>

      {/* Section 4: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">Issues by Category</h3>
          <div className="aspect-square relative w-full max-w-[200px] mx-auto">
            <Doughnut data={categoryChartData} options={{ plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }, maintainAspectRatio: true }} />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">Reports — Last 7 Days</h3>
          <div className="aspect-video relative w-full">
            <Bar data={dailyChartData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, maintainAspectRatio: true }} />
          </div>
        </div>
      </div>

      {/* Section 5: Top Upvoted */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-bold text-slate-800 mb-4 text-sm">Most Upvoted Open Issues</h3>
        {topUpvoted.length > 0 ? (
          <div className="space-y-3">
            {topUpvoted.map(issue => (
              <div key={issue.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded text-xs min-w-[2.5rem] text-center">
                  {issue.upvotes || 0}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{issue.title}</div>
                  <div className="text-[10px] uppercase text-slate-500 font-medium mt-0.5">{issue.category?.replace('_', ' ')}</div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'moderate' ? 'bg-amber-500' : 'bg-green-500'}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No open issues yet.</div>
        )}
      </div>

    </div>
  );
}
