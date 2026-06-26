import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const severityIcon = (severity) => L.divIcon({
  className: '',
  html: `<div style="
    width: 14px; height: 14px; border-radius: 50%;
    background: ${severity === 'critical' ? '#ef4444' : severity === 'moderate' ? '#f59e0b' : '#22c55e'};
    border: 2px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function IssueMap() {
  const {
    issues,
    loading,
    selectedIssue,
    selectIssue,
    clearSelectedIssue,
    upvoteIssue,
    updateIssueStatus
  } = useIssues();

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 120px)', width: '100%' }} className="flex items-center justify-center">
        Loading map…
      </div>
    );
  }

  return (
    <>
      <div style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
        <MapContainer center={[28.4595, 77.0266]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {issues.map(issue => (
            issue.lat && issue.lng && (
              <Marker 
                key={issue.id} 
                position={[issue.lat, issue.lng]} 
                icon={severityIcon(issue.severity)}
              >
                <Popup>
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    {issue.image_url && (
                      <img src={issue.image_url} alt={issue.title} className="w-20 h-auto object-cover rounded" />
                    )}
                    <strong className="text-sm">{issue.title}</strong>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'moderate' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                      <span className="text-xs capitalize">{issue.severity}</span>
                    </div>
                    <div className="text-xs text-slate-600">👍 {issue.upvotes || 0}</div>
                    <button 
                      onClick={() => selectIssue(issue)}
                      className="mt-1 bg-emerald-600 text-white px-2 py-1 text-xs rounded hover:bg-emerald-700"
                    >
                      View details
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
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
