import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export default function useIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    let subscription;

    async function fetchIssues() {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to load issues.');
      } else {
        setIssues(data);
      }
      setLoading(false);

      subscription = supabase
        .channel(`issues-insert-${Math.random()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'issues' },
          (payload) => {
            setIssues((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe();
    }

    fetchIssues();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const selectIssue = (issue) => setSelectedIssue(issue);
  const clearSelectedIssue = () => setSelectedIssue(null);

  const upvoteIssue = async (issueId) => {
    let sessionId = localStorage.getItem('ch_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2);
      localStorage.setItem('ch_session_id', sessionId);
    }

    const { error } = await supabase
      .from('upvote_logs')
      .insert({ issue_id: issueId, session_id: sessionId });

    if (error && error.code === '23505') {
      return;
    }

    await supabase.rpc('increment_upvotes', { issue_id: issueId });

    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId ? { ...i, upvotes: (i.upvotes || 0) + 1 } : i
      )
    );

    setSelectedIssue((prev) =>
      prev?.id === issueId ? { ...prev, upvotes: (prev.upvotes || 0) + 1 } : prev
    );
  };

  const updateIssueStatus = async (issueId, newStatus) => {
    const { error } = await supabase
      .from('issues')
      .update({ status: newStatus })
      .eq('id', issueId);

    if (!error) {
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
      );
      setSelectedIssue((prev) =>
        prev?.id === issueId ? { ...prev, status: newStatus } : prev
      );
    }
  };

  return {
    issues,
    loading,
    error,
    selectedIssue,
    selectIssue,
    clearSelectedIssue,
    upvoteIssue,
    updateIssueStatus,
  };
}
