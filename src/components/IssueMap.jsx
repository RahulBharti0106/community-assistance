import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useIssues from '../hooks/useIssues';
import IssueModal from './IssueModal';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const getSeverityColor = (issue) => {
  if (issue.status === 'resolved') return '#6b7280';
  return issue.severity === 'critical' ? '#dc2626' : issue.severity === 'moderate' ? '#d97706' : '#15803d';
};

const severityIcon = (issue) => L.divIcon({
  className: '',
  html: `<div style="
    width: 14px; height: 14px; border-radius: 50%;
    background: ${getSeverityColor(issue)};
    border: 2px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const clusterIcon = (count, hasCritical) => L.divIcon({
  className: '',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: ${hasCritical ? '#dc2626' : '#1d4ed8'};
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 12px; font-weight: 600;
  ">${count}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function clusterIssues(issues, zoomLevel) {
  const cellSize = zoomLevel >= 15 ? 0.001 : zoomLevel >= 13 ? 0.005 : 0.01;
  const cells = {};
  issues.forEach(issue => {
    if (!issue.lat || !issue.lng) return;
    const key = `${Math.floor(issue.lat / cellSize)}_${Math.floor(issue.lng / cellSize)}`;
    if (!cells[key]) cells[key] = { issues: [], lat: 0, lng: 0 };
    cells[key].issues.push(issue);
    cells[key].lat += issue.lat;
    cells[key].lng += issue.lng;
  });
  return Object.values(cells).map(cell => ({
    issues: cell.issues,
    lat: cell.lat / cell.issues.length,
    lng: cell.lng / cell.issues.length,
    isSingle: cell.issues.length === 1
  }));
}

function MapController({ flyTarget, setFlyTarget, flyToIssue, onFlyComplete, selectIssue, setZoomLevel, isFlying, setIsFlying }) {
  const map = useMap();
  
  useMapEvents({
    zoomend: (e) => {
      if (!isFlying) setZoomLevel(e.target.getZoom());
    }
  });

  useEffect(() => {
    if (flyTarget) {
      setIsFlying(true);
      map.flyTo([flyTarget.lat, flyTarget.lng], 16, { duration: 1.0 });
      const onMoveEnd = () => {
        setIsFlying(false);
        selectIssue(flyTarget);
        setFlyTarget(null);
        map.off('moveend', onMoveEnd);
      };
      map.on('moveend', onMoveEnd);
    }
  }, [flyTarget, map, selectIssue, setFlyTarget, setIsFlying]);

  useEffect(() => {
    if (flyToIssue) {
      onFlyComplete();
      setIsFlying(true);
      map.flyTo([flyToIssue.lat, flyToIssue.lng], 16, { duration: 1.0 });
      const onMoveEnd = () => {
        setIsFlying(false);
        selectIssue(flyToIssue);
        map.off('moveend', onMoveEnd);
      };
      map.on('moveend', onMoveEnd);
    }
  }, [flyToIssue, map, selectIssue, onFlyComplete, setIsFlying]);

  return null;
}

export default function IssueMap({ flyToIssue, onFlyComplete }) {
  const {
    issues,
    loading,
    selectedIssue,
    selectIssue,
    clearSelectedIssue,
    upvoteIssue,
    updateIssueStatus
  } = useIssues();

  const [zoomLevel, setZoomLevel] = useState(14);
  const [flyTarget, setFlyTarget] = useState(null);
  const [sheetCluster, setSheetCluster] = useState(null);
  const [dropdownValue, setDropdownValue] = useState("");
  const [isFlying, setIsFlying] = useState(false);

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 120px)', width: '100%' }} className="flex items-center justify-center text-slate-500 font-medium">
        Loading reported issues…
      </div>
    );
  }

  const validIssues = issues.filter(i => i.lat && i.lng);
  const sortedValidIssues = [...validIssues].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const defaultCenter = sortedValidIssues.length > 0 ? [sortedValidIssues[0].lat, sortedValidIssues[0].lng] : [28.4595, 77.0266];
  const defaultZoom = sortedValidIssues.length > 0 ? 14 : 12;

  const clusters = clusterIssues(validIssues, zoomLevel);

  const severityEmoji = { critical: '🔴', moderate: '🟡', minor: '🟢' };
  const getEmoji = (issue) => issue.status === 'resolved' ? '⚫' : (severityEmoji[issue.severity] || '⚪');

  return (
    <>
      <style>{`
        .bottom-sheet {
          transition: transform 0.3s ease;
          transform: translateY(100%);
        }
        .bottom-sheet.open {
          transform: translateY(0);
        }
      `}</style>

      <div className="p-2 bg-[var(--ch-surface)] border-b border-[var(--ch-border)]">
        <select 
          value={dropdownValue} 
          onChange={(e) => {
            const issueId = e.target.value;
            if (!issueId) return;
            const issue = validIssues.find(i => i.id === issueId);
            if (issue) {
              setFlyTarget(issue);
            }
            setDropdownValue("");
          }}
          className="w-full p-2 rounded-lg border border-[var(--ch-border)] text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--ch-accent)] text-[var(--ch-ink)] font-medium"
        >
          <option value="" disabled>— Jump to a complaint —</option>
          {sortedValidIssues.map(issue => (
             <option key={issue.id} value={issue.id}>
               {`${getEmoji(issue)} ${issue.title} — ${issue.address ? issue.address.substring(0, 30) : ''}`}
             </option>
          ))}
        </select>
      </div>

      <div style={{ height: 'calc(100vh - 180px)', width: '100%' }} className="relative overflow-hidden">
        <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapController 
            flyTarget={flyTarget}
            setFlyTarget={setFlyTarget}
            flyToIssue={flyToIssue}
            onFlyComplete={onFlyComplete}
            selectIssue={selectIssue}
            setZoomLevel={setZoomLevel}
            isFlying={isFlying}
            setIsFlying={setIsFlying}
          />
          {clusters.map((cluster, idx) => {
            if (cluster.isSingle) {
              const issue = cluster.issues[0];
              return (
                <Marker 
                  key={`issue-${issue.id}`} 
                  position={[issue.lat, issue.lng]} 
                  icon={severityIcon(issue)}
                  eventHandlers={{
                    click: () => {
                      selectIssue(issue);
                    },
                  }}
                />
              );
            } else {
              const hasCritical = cluster.issues.some(i => i.severity === 'critical' && i.status !== 'resolved');
              return (
                <Marker
                  key={`cluster-${idx}`}
                  position={[cluster.lat, cluster.lng]}
                  icon={clusterIcon(cluster.issues.length, hasCritical)}
                  eventHandlers={{
                    click: () => {
                      setSheetCluster(cluster);
                    }
                  }}
                />
              );
            }
          })}
        </MapContainer>

        <div className={`absolute bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto bg-[var(--ch-surface)] rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.15)] z-[1000] bottom-sheet ${sheetCluster ? 'open' : ''}`}>
          <div className="flex justify-between items-center p-4 border-b border-[var(--ch-border)] sticky top-0 bg-[var(--ch-surface)] z-10">
            <h3 className="font-semibold text-[var(--ch-ink)] text-sm tracking-tight">{sheetCluster?.issues.length} Issues in this area</h3>
            <button onClick={() => setSheetCluster(null)} className="p-1 rounded-full text-[var(--ch-ink)] opacity-50 hover:opacity-100 bg-slate-100 hover:bg-slate-200 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {sheetCluster?.issues.map(issue => (
              <div key={issue.id} className="flex gap-3">
                <div className="mt-1 flex-shrink-0">
                   <span className="w-3 h-3 rounded-full inline-block shadow-sm" style={{ background: getSeverityColor(issue) }}></span>
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-[var(--ch-ink)] text-sm tracking-tight">{issue.title}</h4>
                   <p className="text-xs text-slate-500 truncate mt-0.5">{issue.address}</p>
                   <button 
                     onClick={() => {
                       setSheetCluster(null);
                       selectIssue(issue);
                     }}
                     className="text-xs text-[var(--ch-accent)] mt-1.5 font-semibold hover:underline text-left tracking-wide uppercase"
                   >
                     View details &rarr;
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {selectedIssue && (
        <IssueModal 
          issue={selectedIssue} 
          onClose={clearSelectedIssue} 
          onUpvote={upvoteIssue} 
          onStatusChange={updateIssueStatus} 
        />
      )}
    </>
  );
}

