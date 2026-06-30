import { useState, useRef } from 'react';
import supabase from '../lib/supabase';
import { analyzeIssueImage, checkDuplicate } from '../lib/gemini';
import { getCurrentPosition, reverseGeocode, forwardGeocode } from '../lib/geo';
import { compressImage } from '../lib/imageUtils';

export default function useReportForm() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState(false);
  const [error, setError] = useState(null);

  // FIX: use a ref for coords so handleAddressBlur always reads the latest value
  // useState has stale closure issues when read inside async callbacks
  const coordsRef = useRef({ lat: null, lng: null });
  const [coords, setCoords] = useState({ lat: null, lng: null });

  const updateCoords = (lat, lng) => {
    coordsRef.current = { lat, lng };
    setCoords({ lat, lng });
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    severity: 'minor',
    urgency_reason: '',
    action_recommendation: '',
    address: ''
  });

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);

    try {
      const compressedBlob = await compressImage(file);
      
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(compressedBlob);
      });

      setIsAnalyzing(true);
      setError(null);

      // FIX: use updateCoords instead of setCoords
      getCurrentPosition()
        .then(pos => {
          const { latitude, longitude } = pos.coords;
          updateCoords(latitude, longitude);
          return reverseGeocode(latitude, longitude);
        })
        .then(address => {
          setForm(prev => ({ ...prev, address }));
        })
        .catch(() => {});
      
      const analysis = await analyzeIssueImage(base64, 'image/jpeg');
      setForm(prev => ({ ...prev, ...analysis }));
      
      setIsAnalyzing(false);
    } catch (err) {
      setError("Could not analyze image. Please fill in the details manually.");
      setIsAnalyzing(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // FIX: when user edits address field, reset coords via ref too
    if (field === 'address') {
      updateCoords(null, null);
    }
  };

  const handleGetLocation = () => {
    getCurrentPosition()
      .then(pos => {
        const { latitude, longitude } = pos.coords;
        // FIX: use updateCoords
        updateCoords(latitude, longitude);
        return reverseGeocode(latitude, longitude);
      })
      .then(address => {
        setForm(prev => ({ ...prev, address }));
      })
      .catch((err) => {
        setError("Failed to get location: " + (err.message || "Please allow location access"));
      });
  };

  const handleAddressBlur = async () => {
    if (!form.address || form.address.trim().length < 5) return;
    
    // FIX: read from ref, not state — ref is always current, no stale closure
    if (coordsRef.current.lat && coordsRef.current.lng) return;

    const result = await forwardGeocode(form.address);
    if (result) {
      updateCoords(result.lat, result.lng);
      // Optionally update address to the clean Nominatim display name
      // setForm(prev => ({ ...prev, address: result.displayName }));
    }
  };

  const runDuplicateCheck = async (newIssueId, newTitle, newDescription, lat, lng) => {
    if (lat === null || lng === null) return;
    
    setIsDuplicateChecking(true);
    try {
      const { data: nearbyIssues, error: fetchError } = await supabase
        .from('issues')
        .select('id, title, description, upvotes')
        .neq('id', newIssueId)
        .gte('lat', lat - 0.002)
        .lte('lat', lat + 0.002)
        .gte('lng', lng - 0.002)
        .lte('lng', lng + 0.002)
        .limit(5);

      if (fetchError || !nearbyIssues || nearbyIssues.length === 0) {
        setIsDuplicateChecking(false);
        return;
      }

      for (const issue of nearbyIssues) {
        const result = await checkDuplicate(newTitle, newDescription, issue.title, issue.description);
        if (result.duplicate === true && result.confidence >= 0.8) {
          await supabase.from('issues').update({ upvotes: (issue.upvotes || 0) + 1 }).eq('id', issue.id);
          await supabase.from('issues').delete().eq('id', newIssueId);
          setDuplicateFound(true);
          break;
        }
      }
    } catch (err) {
      // ignore
    }
    setIsDuplicateChecking(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Please add a title before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error: uploadError } = await supabase.storage.from('issue-images').upload(filename, imageFile);
      
      if (uploadError) {
        console.error('Upload Error:', uploadError);
        setError("Image upload failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('issue-images').getPublicUrl(filename);
      const publicUrl = publicUrlData.publicUrl;

      // FIX: read from ref for submit too — guaranteed to be latest
      let finalLat = coordsRef.current.lat;
      let finalLng = coordsRef.current.lng;

      if (!finalLat || !finalLng) {
        const geocoded = await forwardGeocode(form.address);
        if (geocoded) {
          finalLat = geocoded.lat;
          finalLng = geocoded.lng;
        }
      }

      const { data: insertedIssue, error: insertError } = await supabase.from('issues').insert([{
        ...form,
        image_url: publicUrl,
        lat: finalLat,
        lng: finalLng,
        status: 'reported'
      }]).select().single();

      if (insertError) {
        setError("Failed to submit report. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);

      runDuplicateCheck(insertedIssue.id, form.title, form.description, finalLat, finalLng);

    } catch (err) {
      setError("Failed to submit report. Please try again.");
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl('');
    setIsAnalyzing(false);
    setIsSubmitting(false);
    setIsDuplicateChecking(false);
    setSubmitSuccess(false);
    setDuplicateFound(false);
    setError(null);
    // FIX: reset ref too
    updateCoords(null, null);
    setForm({
      title: '',
      description: '',
      category: 'other',
      severity: 'minor',
      urgency_reason: '',
      action_recommendation: '',
      address: ''
    });
  };

  return {
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
    handleAddressBlur,
    handleSubmit,
    resetForm
  };
}