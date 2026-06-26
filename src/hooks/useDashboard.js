import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { getClusterInsight, getPriorityRanking } from '../lib/gemini';

export default function useDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clusterInsight, setClusterInsight] = useState(null);
  const [priorityRankings, setPriorityRankings] = useState([]);
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
      setPriorityRankings([]);
      return;
    }

    setAiLoading(true);
    setAiError(null);

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

    const [insightResult, rankingResult] = await Promise.allSettled([
      getClusterInsight(clusters),
      getPriorityRanking(fetchedIssues.filter(i => i.status !== 'resolved').slice(0, 20))
    ]);

    if (insightResult.status === 'fulfilled') {
      setClusterInsight(insightResult.value);
    }
    if (rankingResult.status === 'fulfilled') {
      setPriorityRankings(rankingResult.value);
    }
    if (insightResult.status === 'rejected' || rankingResult.status === 'rejected') {
      setAiError("AI insights unavailable. Showing data only.");
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

  const CATEGORY_LABELS = {
    pothole: 'Pothole', streetlight: 'Streetlight',
    water_leak: 'Water Leak', waste: 'Waste', other: 'Other'
  };
  const CATEGORY_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6'];
  const categoryChartData = {
    labels: Object.values(CATEGORY_LABELS),
    datasets: [{
      data: Object.keys(CATEGORY_LABELS).map(cat => issues.filter(i => i.category === cat).length),
      backgroundColor: CATEGORY_COLORS,
      borderWidth: 0
    }]
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dailyChartData = {
    labels: last7Days.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'Issues Reported',
      data: last7Days.map(day => issues.filter(i => i.created_at.startsWith(day)).length),
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }]
  };

  const topUpvoted = [...issues]
    .filter(i => i.status !== 'resolved')
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    .slice(0, 5);

  const rankedIssues = priorityRankings
    .map(r => ({ ...r, issue: issues.find(i => i.id === r.id) }))
    .filter(r => r.issue);

  return {
    loading,
    aiLoading,
    aiError,
    metrics,
    categoryChartData,
    dailyChartData,
    topUpvoted,
    clusterInsight,
    rankedIssues
  };
}
