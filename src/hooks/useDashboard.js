import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { getClusterInsight, getTrendInsight } from '../lib/gemini';

export default function useDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clusterInsight, setClusterInsight] = useState(null);
  const [trendInsight, setTrendInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    async function fetchIssues() {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load issues', error);
      } else {
        setIssues(data || []);
        runAIAnalysis(data || []);
      }
      setLoading(false);
    }
    fetchIssues();
  }, []);

  const runAIAnalysis = async (fetchedIssues) => {
    if (fetchedIssues.length < 2) {
      setClusterInsight(null);
      setTrendInsight(null);
      return;
    }

    setAiLoading(true);
    setAiError(null);

    // Cluster grouping — unchanged from before
    const cellKey = (issue) => {
      if (!issue.lat || !issue.lng) return null;
      const latCell = Math.floor(issue.lat / 0.01);
      const lngCell = Math.floor(issue.lng / 0.01);
      return `${latCell}_${lngCell}`;
    };
    const grouped = new Map();
    fetchedIssues.forEach(issue => {
      const key = cellKey(issue);
      if (key) {
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(issue);
      }
    });
    const clusters = Array.from(grouped.entries())
      .filter(([_, issuesInCluster]) => issuesInCluster.length >= 2)
      .map(([key, issuesInCluster]) => ({
        area: `Grid ${key}`,
        issues: issuesInCluster.map(i => ({ title: i.title, category: i.category, severity: i.severity }))
      }));

    // Trend data — compute fresh here too (cannot reference categoryTrends from outside since this runs on mount before issues state settles)
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
    const trendsForAI = ['pothole', 'streetlight', 'water_leak', 'waste', 'other'].map(category => ({
      category,
      last7Days: fetchedIssues.filter(i => i.category === category && new Date(i.created_at).getTime() >= sevenDaysAgo).length,
      previous7Days: fetchedIssues.filter(i => i.category === category && new Date(i.created_at).getTime() >= fourteenDaysAgo && new Date(i.created_at).getTime() < sevenDaysAgo).length
    }));
    const criticalOpenCount = fetchedIssues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
    const totalOpenCount = fetchedIssues.filter(i => i.status !== 'resolved').length;

    const [insightResult, trendResult] = await Promise.allSettled([
      getClusterInsight(clusters),
      getTrendInsight(trendsForAI, criticalOpenCount, totalOpenCount)
    ]);

    if (insightResult.status === 'fulfilled') setClusterInsight(insightResult.value);
    if (trendResult.status === 'fulfilled') setTrendInsight(trendResult.value);
    if (insightResult.status === 'rejected' || trendResult.status === 'rejected') {
      setAiError("Some insights unavailable. Showing data only.");
    }
    setAiLoading(false);
  };

  const metrics = {
    total: issues.length,
    resolvedThisWeek: issues.filter(i => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return i.status === 'resolved' && new Date(i.created_at) >= weekAgo;
    }).length,
    criticalOpen: issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length,
    mostActiveArea: (() => {
      if (!issues.length) return 'N/A';
      const areaCounts = {};
      issues.forEach(i => {
        if (i.address) {
          const area = i.address.split(',')[0];
          areaCounts[area] = (areaCounts[area] || 0) + 1;
        }
      });
      return Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    })()
  };

  const CATEGORY_LIST = ['pothole', 'streetlight', 'water_leak', 'waste', 'other'];
  const CATEGORY_LABELS = {
    pothole: 'Pothole', streetlight: 'Streetlight',
    water_leak: 'Water Leak', waste: 'Waste', other: 'Other'
  };
  const CATEGORY_COLORS = ['#dc2626', '#d97706', '#1d4ed8', '#15803d', '#6b7280'];
  const categoryChartData = {
    labels: Object.values(CATEGORY_LABELS),
    datasets: [{
      data: Object.keys(CATEGORY_LABELS).map(cat => issues.filter(i => i.category === cat).length),
      backgroundColor: CATEGORY_COLORS,
      borderWidth: 0
    }]
  };

  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dailyChartData = {
    labels: last7DaysData.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'Issues Reported',
      data: last7DaysData.map(day => issues.filter(i => i.created_at.startsWith(day)).length),
      backgroundColor: '#1d4ed8',
      borderRadius: 6
    }]
  };

  const topUpvoted = [...issues]
    .filter(i => i.status !== 'resolved')
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    .slice(0, 5);

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const CATEGORY_LINE_COLORS = {
    pothole: '#dc2626', streetlight: '#d97706',
    water_leak: '#1d4ed8', waste: '#15803d', other: '#6b7280'
  };

  const categoryTrendChartData = {
    labels: last14Days.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
    datasets: CATEGORY_LIST.map(category => ({
      label: CATEGORY_LABELS[category],
      data: last14Days.map(day =>
        issues.filter(i => i.category === category && i.created_at.startsWith(day)).length
      ),
      borderColor: CATEGORY_LINE_COLORS[category],
      backgroundColor: CATEGORY_LINE_COLORS[category],
      tension: 0.3,
      pointRadius: 2
    }))
  };

  return {
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
  };
}
