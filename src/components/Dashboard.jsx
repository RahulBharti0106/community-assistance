import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import useDashboard from '../hooks/useDashboard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

export default function Dashboard() {
  const {
    loading,
    aiLoading,
    aiError,
    metrics,
    categoryChartData,
    dailyChartData,
    categoryTrendChartData,
    topUpvoted,
    clusterInsight,
    trendInsight
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

  const cardClass = "bg-[var(--ch-surface)] border border-[var(--ch-border)] rounded-xl p-4";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-[var(--ch-ink)] opacity-60 mt-1";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
      
      {/* Section 1: Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cardClass}>
          <div className="text-3xl font-semibold text-[var(--ch-ink)] tabular-nums">{metrics.total}</div>
          <div className={labelClass}>Total Issues</div>
        </div>
        <div className={cardClass}>
          <div className="text-3xl font-semibold text-[var(--ch-ink)] tabular-nums">{metrics.resolvedThisWeek}</div>
          <div className={labelClass}>Resolved This Week</div>
        </div>
        <div className={cardClass}>
          <div className={`text-3xl font-semibold tabular-nums ${metrics.criticalOpen > 0 ? 'text-[var(--ch-critical)]' : 'text-[var(--ch-ink)]'}`}>
            {metrics.criticalOpen}
          </div>
          <div className={labelClass}>Critical Open</div>
        </div>
        <div className={cardClass}>
          <div className="text-3xl font-semibold text-[var(--ch-ink)] tabular-nums truncate" title={metrics.mostActiveArea}>
            {metrics.mostActiveArea}
          </div>
          <div className={labelClass}>Most Active Area</div>
        </div>
      </div>

      {/* Section 2: AI Cluster Insight */}
      <div className="bg-gradient-to-br from-[#eff6ff] to-slate-50 border border-[var(--ch-border)] border-l-4 rounded-xl p-4" style={{ borderLeftColor: 'var(--ch-accent)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-semibold text-xs text-[var(--ch-ink)] uppercase tracking-wide">Pattern Detection</span>
        </div>
        
        {aiLoading ? (
          <div className="animate-pulse bg-blue-100/50 rounded h-12 w-full" />
        ) : aiError ? (
          <div className="text-sm text-amber-700">{aiError}</div>
        ) : clusterInsight ? (
          <div className="text-sm text-[var(--ch-ink)] leading-relaxed">{clusterInsight}</div>
        ) : (
          <div className="text-sm text-[var(--ch-ink)] opacity-60">Patterns will appear once issues cluster in the same area.</div>
        )}
      </div>

      {/* Section 3: AI Trend Insight */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📈</span>
          <h3 className="font-bold text-[var(--ch-ink)] text-sm tracking-tight">Issue Trends — Last 14 Days</h3>
        </div>

        {aiLoading ? (
          <div className="animate-pulse bg-slate-100 rounded h-4 w-3/4 mb-4 mt-1" />
        ) : trendInsight ? (
          <p className="text-xs text-[var(--ch-ink)] leading-relaxed mb-4 mt-1">{trendInsight}</p>
        ) : (
          <p className="text-xs text-[var(--ch-ink)] opacity-60 mb-4 mt-1">Trends will appear once more issues are reported.</p>
        )}

        <div className="h-56 relative w-full">
          <Line
            data={categoryTrendChartData}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }, x: { ticks: { font: { size: 9 } } } }
            }}
          />
        </div>
      </div>

      {/* Section 4: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cardClass}>
          <h3 className="font-bold text-[var(--ch-ink)] mb-4 text-sm tracking-tight">Issues by Category</h3>
          <div className="aspect-square relative w-full max-w-[200px] mx-auto">
            <Doughnut data={categoryChartData} options={{ plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }, maintainAspectRatio: true }} />
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-[var(--ch-ink)] mb-4 text-sm tracking-tight">Reports — Last 7 Days</h3>
          <div className="aspect-video relative w-full">
            <Bar data={dailyChartData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, maintainAspectRatio: true }} />
          </div>
        </div>
      </div>

      {/* Section 5: Top Upvoted */}
      <div className={cardClass}>
        <h3 className="font-bold text-[var(--ch-ink)] mb-4 text-sm tracking-tight">Most Upvoted Open Issues</h3>
        {topUpvoted.length > 0 ? (
          <div className="space-y-3">
            {topUpvoted.map(issue => (
              <div key={issue.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="bg-slate-100 text-[var(--ch-ink)] font-bold px-2 py-1 rounded-lg text-xs min-w-[2.5rem] text-center tabular-nums border border-[var(--ch-border)]">
                  {issue.upvotes || 0}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[var(--ch-ink)] truncate tracking-tight">{issue.title}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mt-0.5">{issue.category?.replace('_', ' ')}</div>
                </div>
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `var(--ch-${issue.severity})` }} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[var(--ch-ink)] opacity-60">No open issues yet.</div>
        )}
      </div>

    </div>
  );
}
