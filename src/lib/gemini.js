export async function analyzeIssueImage(base64ImageData, mimeType) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64: base64ImageData, mimeType })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Analysis failed: ' + data.error);
  }
  
  return data;
}

export async function checkDuplicate(newTitle, newDescription, existingTitle, existingDescription) {
  const response = await fetch('/api/duplicate-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newTitle, newDescription, existingTitle, existingDescription })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Duplicate check failed: ' + data.error);
  }
  
  return data;
}
