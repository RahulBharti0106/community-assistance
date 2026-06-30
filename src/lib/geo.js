export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      reject(new Error(error.message));
    });
  });
}

export async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { 'User-Agent': 'community-hero-app' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.display_name || "Unknown location";
  } catch (error) {
    return "Unknown location";
  }
}

export async function forwardGeocode(addressString) {
  if (!addressString || addressString.trim().length < 5) return null
  try {
    const encoded = encodeURIComponent(addressString.trim())
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      { headers: { 'User-Agent': 'community-hero-app' } }
    )
    const data = await response.json()
    if (!data || data.length === 0) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name
    }
  } catch {
    return null
  }
}
