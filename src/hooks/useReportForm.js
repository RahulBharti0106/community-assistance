import { useState } from 'react';
import supabase from '../lib/supabase';
import { analyzeIssueImage, checkDuplicate } from '../lib/gemini';
import { getCurrentPosition, reverseGeocode } from '../lib/geo';
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

      getCurrentPosition()
        .then(pos => {
          const { latitude, longitude } = pos.coords;
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
  };

  const handleGetLocation = () => {
    getCurrentPosition()
      .then(pos => {
        const { latitude, longitude } = pos.coords;
        return reverseGeocode(latitude, longitude);
      })
      .then(address => {
        setForm(prev => ({ ...prev, address }));
      })
      .catch((err) => {
        setError("Failed to get location: " + (err.message || "Please allow location access"));
      });
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

      let latitude = null;
      let longitude = null;
      try {
        const pos = await getCurrentPosition();
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch (geoErr) {
        // ignore
      }

      const { data: insertedIssue, error: insertError } = await supabase.from('issues').insert([{
        ...form,
        image_url: publicUrl,
        lat: latitude,
        lng: longitude,
        status: 'reported'
      }]).select().single();

      if (insertError) {
        setError("Failed to submit report. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);

      runDuplicateCheck(insertedIssue.id, form.title, form.description, latitude, longitude);

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
    handleSubmit,
    resetForm
  };
}
