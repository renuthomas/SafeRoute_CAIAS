let loadedPromise = null;

const DEFAULT_LIBRARIES = ['places', 'geometry', 'visualization', 'routes'];

/**
 * Loads the Google Maps JS API and returns the `google.maps` namespace.
 * This is safe to call multiple times; it will share the same promise.
 */
export function loadGoogleMaps({ apiKey, libraries = DEFAULT_LIBRARIES } = {}) {
  if (loadedPromise) return loadedPromise;

  const key = apiKey ?? import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(new Error('Google Maps API key is not configured.'));
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in a browser environment.'));
  }

  if (window.google?.maps) {
    loadedPromise = Promise.resolve(window.google.maps);
    return loadedPromise;
  }

  loadedPromise = new Promise((resolve, reject) => {
    const scriptId = 'safe-route-google-maps-script';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject(new Error('Google Maps loaded but window.google.maps is unavailable.'));
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.defer = true;

    const libs = Array.isArray(libraries) ? libraries.join(',') : libraries;
    const params = new URLSearchParams({
      key: key,
      libraries: libs,
      v: 'weekly',
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps loaded but window.google.maps is unavailable.'));
      }
    };

    script.onerror = () => reject(new Error('Failed to load Google Maps script.'));

    document.head.appendChild(script);
  });

  return loadedPromise;
}

/**
 * Returns the loaded google.maps namespace, or null if not loaded.
 */
export function getGoogleMaps() {
  return typeof window !== 'undefined' ? window.google?.maps || null : null;
}
