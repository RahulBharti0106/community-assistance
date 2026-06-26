import useReportForm from '../hooks/useReportForm';

export default function ReportForm() {
  const {
    imagePreviewUrl,
    isAnalyzing,
    isSubmitting,
    isDuplicateChecking,
    submitSuccess,
    duplicateFound,
    error,
    form,
    handleImageChange,
    handleFieldChange,
    handleGetLocation,
    handleSubmit,
    resetForm
  } = useReportForm();

  if (submitSuccess) {
    return (
      <div className="max-w-lg mx-auto p-4 text-center">
        <svg className="w-16 h-16 mx-auto text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted</h2>
        {isDuplicateChecking && <p className="text-sm text-slate-500 mb-4">Checking for duplicates…</p>}
        {duplicateFound && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-3 mb-4 text-left">
            This looks like an existing issue — your upvote has been added.
          </div>
        )}
        <button
          onClick={resetForm}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-4"
        >
          Report Another Issue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <label className="block relative w-full h-48 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer mb-4 flex flex-col items-center justify-center">
        <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
        
        {!imagePreviewUrl && (
          <div className="text-center text-slate-500 flex flex-col items-center">
            <span className="text-3xl mb-2">📷</span>
            <span className="text-sm font-medium">Tap to photograph or upload an issue</span>
          </div>
        )}

        {imagePreviewUrl && (
          <>
            <img src={imagePreviewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs text-center py-2">
              Change photo
            </div>
          </>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full mb-3" style={{ animation: 'spin 0.8s linear infinite' }}></div>
            <span className="text-sm font-medium">Gemini is analyzing your photo…</span>
          </div>
        )}
      </label>

      {isAnalyzing ? (
        <span className="inline-block bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full mb-4">
          Analyzing with Gemini 2.5 Pro…
        </span>
      ) : form.title ? (
        <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-3 py-1 rounded-full mb-4">
          AI-filled — review and edit before submitting
        </span>
      ) : null}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Issue Title</label>
        <input 
          type="text" 
          value={form.title} 
          onChange={e => handleFieldChange('title', e.target.value)} 
          placeholder="e.g. Large pothole blocking lane"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select 
          value={form.category} 
          onChange={e => handleFieldChange('category', e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="pothole">Pothole</option>
          <option value="streetlight">Streetlight</option>
          <option value="water_leak">Water Leak</option>
          <option value="waste">Waste / Garbage</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
        <select 
          value={form.severity} 
          onChange={e => handleFieldChange('severity', e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="critical">Critical</option>
          <option value="moderate">Moderate</option>
          <option value="minor">Minor</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea 
          rows={3}
          value={form.description} 
          onChange={e => handleFieldChange('description', e.target.value)}
          placeholder="Describe the issue…"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Why this severity?</label>
        <textarea 
          rows={2}
          value={form.urgency_reason} 
          onChange={e => handleFieldChange('urgency_reason', e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Recommended action</label>
        <textarea 
          rows={2}
          value={form.action_recommendation} 
          onChange={e => handleFieldChange('action_recommendation', e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={form.address} 
            onChange={e => handleFieldChange('address', e.target.value)} 
            placeholder="Address or location description"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button 
            type="button"
            onClick={handleGetLocation}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            📍 Detect
          </button>
        </div>
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={isAnalyzing || isSubmitting || !imagePreviewUrl}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        {isSubmitting ? "Submitting…" : "Submit Report"}
      </button>
    </div>
  );
}
