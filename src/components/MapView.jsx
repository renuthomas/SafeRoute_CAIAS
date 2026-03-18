import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../services/googleMaps';
import { subscribeToIncidents, subscribeToScores } from '../services/firestore';
import './MapView.css';

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.0060 }; // Default to NYC

export default function MapView({ center = DEFAULT_CENTER, zoom = 13, searchQuery = '', onSearchResult, route = null }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const optionsSetRef = useRef(false);
  const [status, setStatus] = useState(apiKey ? 'loading' : 'no-key');
  const [searchStatus, setSearchStatus] = useState('idle');
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const routesRef = useRef([]);
  const heatmapRef = useRef(null);
  const routePolylineRef = useRef(null);
  const routeMarkersRef = useRef([]);
  const searchMarkerRef = useRef(null);
  const geocoderRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const useRoutesApiRef = useRef(false);
  const lastSearchRef = useRef('');

  useEffect(() => {
    loadGoogleMaps({ apiKey })
      .then(() => {
        if (!mapRef.current) return;

        if (!mapInstance.current) {
          mapInstance.current = new window.google.maps.Map(mapRef.current, {
            center,
            zoom,
            disableDefaultUI: false,
            streetViewControl: false,
          });

          geocoderRef.current = new window.google.maps.Geocoder();

          // Prefer the new Routes API when available (avoids deprecation warnings).
          const hasRoutesApi = Boolean(window.google?.maps?.routes?.Route?.computeRoutes);
          useRoutesApiRef.current = hasRoutesApi;

          if (!hasRoutesApi) {
            directionsServiceRef.current = new window.google.maps.DirectionsService();
            directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
              map: mapInstance.current,
              suppressMarkers: true,
              preserveViewport: true,
            });
          }

          setStatus('ready');
        } else {
          mapInstance.current.setCenter(center);
          mapInstance.current.setZoom(zoom);
        }
      })
      .catch((err) => {
        console.error('Google Maps load error', err);
        setStatus('error');
      });
  }, [apiKey, center, zoom]);

  // Handle search queries (geocoding + map centering)
  useEffect(() => {
    if (status !== 'ready' || !mapInstance.current) return;
    if (!searchQuery?.trim()) {
      setSearchStatus('idle');
      return;
    }

    setSearchStatus('searching');

    const doSearch = async () => {
      const query = searchQuery.trim();
      if (lastSearchRef.current === query) return;
      lastSearchRef.current = query;

      if (!geocoderRef.current) {
        geocoderRef.current = new window.google.maps.Geocoder();
      }

      try {
        const { results } = await geocoderRef.current.geocode({ address: query });
        const first = results?.[0];
        if (!first?.geometry?.location) {
          setSearchStatus('no-results');
          return;
        }

        const location = {
          lat: first.geometry.location.lat(),
          lng: first.geometry.location.lng(),
        };

        setSearchStatus('done');

        mapInstance.current.panTo(location);
        mapInstance.current.setZoom(15);

        if (searchMarkerRef.current) {
          searchMarkerRef.current.setMap(null);
        }

        searchMarkerRef.current = new window.google.maps.Marker({
          map: mapInstance.current,
          position: location,
          title: first.formatted_address || query,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#10b981',
            fillOpacity: 0.95,
            strokeWeight: 0,
            scale: 9,
          },
        });

        if (onSearchResult) {
          onSearchResult({ query, location, formattedAddress: first.formatted_address });
        }
      } catch (err) {
        console.warn('Geocode failed', err);
        setSearchStatus('error');
      }
    };

    doSearch();
  }, [status, searchQuery, onSearchResult]);

  useEffect(() => {
    if (status !== 'ready' || !mapInstance.current) return;
    if (!route) {
      // Clear any existing route overlay when route is removed.
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      routeMarkersRef.current.forEach((marker) => marker.setMap(null));
      routeMarkersRef.current = [];
      if (directionsRendererRef.current) {
        directionsRendererRef.current.set('directions', null);
      }
      return;
    }

    const origin = route.origin || center;
    const destination = route.destination;
    const travelMode = (route.travelMode || 'WALKING').toUpperCase();

    const clearLegacyRoute = () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.set('directions', null);
      }
    };

    const clearCustomRoute = () => {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      routeMarkersRef.current.forEach((marker) => marker.setMap(null));
      routeMarkersRef.current = [];
    };

    const drawRoute = (path, bounds) => {
      clearCustomRoute();

      routePolylineRef.current = new window.google.maps.Polyline({
        path,
        strokeColor: '#0284c7',
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: mapInstance.current,
      });

      if (bounds) {
        mapInstance.current.fitBounds(bounds, 80);
      }
    };

    const addEndpointMarkers = (originLatLng, destLatLng) => {
      const makeMarker = (pos, label) => {
        const marker = new window.google.maps.Marker({
          position: pos,
          map: mapInstance.current,
          label: { text: label, color: '#ffffff', fontSize: '12px', fontWeight: '700' },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#0284c7',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 8,
          },
        });
        routeMarkersRef.current.push(marker);
      };

      makeMarker(originLatLng, 'A');
      makeMarker(destLatLng, 'B');
    };

    const buildPathFromOverview = (overviewPolyline) => {
      if (!overviewPolyline) return [];
      let encoded = overviewPolyline;
      if (typeof overviewPolyline === 'object' && overviewPolyline.points) {
        encoded = overviewPolyline.points;
      }
      if (!encoded) return [];
      return window.google.maps.geometry.encoding.decodePath(encoded);
    };

    if (useRoutesApiRef.current && window.google?.maps?.routes?.Route?.computeRoutes) {
      clearLegacyRoute();
      const computeRequest = {
        origin,
        destination,
        travelMode: window.google?.maps?.TravelMode?.[travelMode] ?? window.google.maps.TravelMode.WALKING,
        // Required: specify which fields to return from the Routes API
        fields: ['path', 
    'viewport', 
    'durationMillis', 
    'distanceMeters', 
    'legs'],
      };

      window.google.maps.routes.Route.computeRoutes(computeRequest)
        .then((response) => {
          const routeResult = response?.routes?.[0];
          if (!routeResult) {
            console.warn('Routes API returned no route');
            return;
          }

          const bounds = routeResult.viewport ? new window.google.maps.LatLngBounds(
      routeResult.viewport.low, // {lat, lng}
      routeResult.viewport.high  // {lat, lng}
    ) : null;
          
          const encodedPath = routeResult.polyline?.encodedPolyline;
          const path = buildPathFromOverview(encodedPath ||routeResult.overviewPolyline || routeResult.polyline);
          if (path.length) {
            drawRoute(path, bounds);

            // If origin/destination are already lat/lng objects, add markers.
            if (origin?.lat != null && origin?.lng != null && destination?.lat != null && destination?.lng != null) {
              addEndpointMarkers(origin, destination);
            }
          }
        })
        .catch((err) => {
          console.warn('Routes API computeRoutes failed', err);
        });

      return;
    }

    // Legacy DirectionsService fallback (deprecated but still available).
    if (directionsServiceRef.current && directionsRendererRef.current) {
      clearCustomRoute();
      directionsServiceRef.current.route(
        {
          origin,
          destination,
          travelMode: window.google?.maps?.TravelMode?.[travelMode] ?? window.google.maps.TravelMode.WALKING,
        },
        (result, statusRes) => {
          if (statusRes === window.google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current.setDirections(result);

            const bounds = result.routes[0].bounds;
            if (bounds) {
              mapInstance.current.fitBounds(bounds, 80);
            }
          } else {
            console.warn('Directions request failed:', statusRes);
          }
        },
      );
    }
  }, [status, route, center]);

  useEffect(() => {
    if (status !== 'ready' || !mapInstance.current) return;

    const clearMarkers = () => {
      markersRef.current.forEach((marker) => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];

      circlesRef.current.forEach((circle) => circle.setMap(null));
      circlesRef.current = [];
    };

    const createMarker = (position, title) => {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        const el = document.createElement('div');
        el.className = 'advanced-map-marker';
        el.title = title;
        return new window.google.maps.marker.AdvancedMarkerElement({
          map: mapInstance.current,
          position,
          content: el,
        });
      }

      return new window.google.maps.Marker({
        position,
        map: mapInstance.current,
        title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#ef4444',
          fillOpacity: 0.9,
          strokeWeight: 0,
          scale: 7,
        },
      });
    };

    const clearHeatmap = () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };

    const getIncidentWeight = (incident) => {
      // Adjust heatmap intensity based on incident severity/type.
      // The data model currently uses `type` such as 'danger' / 'warning' / 'success'.
      const type = (incident.type || '').toString().toLowerCase();
      if (type.includes('danger') || type.includes('critical') || type.includes('high')) return 1.2;
      if (type.includes('warning') || type.includes('moderate') || type.includes('medium')) return 0.8;
      if (type.includes('success') || type.includes('low') || type.includes('safe')) return 0.4;

      // If there is a numeric severity/score field, use it if available.
      if (typeof incident.severity === 'number') return Math.min(Math.max(incident.severity, 0.1), 2);
      if (typeof incident.score === 'number') return Math.min(Math.max(incident.score / 100, 0.1), 2);

      // Default weight
      return 0.8;
    };

    const updateHeatmap = (items) => {
      if (!window.google?.maps?.visualization?.HeatmapLayer) return;

      const heatData = items
        .filter((incident) => incident.location?.lat != null && incident.location?.lng != null)
        .map((incident) => ({
          location: new window.google.maps.LatLng(incident.location.lat, incident.location.lng),
          weight: getIncidentWeight(incident),
        }));

      if (heatData.length === 0) {
        clearHeatmap();
        return;
      }

      if (!heatmapRef.current) {
        heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
          data: heatData,
          map: mapInstance.current,
          radius: 35,
          opacity: 0.7,
        });
      } else {
        heatmapRef.current.setData(heatData);
      }
    };

    const unsubscribeIncidents = subscribeToIncidents((items) => {
      if (!mapInstance.current) return;
      clearMarkers();

      const bounds = new window.google.maps.LatLngBounds();

      items.forEach((incident) => {
        if (!incident.location || !incident.location.lat || !incident.location.lng) return;

        const position = { lat: incident.location.lat, lng: incident.location.lng };
        const marker = createMarker(position, incident.type);
        markersRef.current.push(marker);

        const circle = new window.google.maps.Circle({
          map: mapInstance.current,
          center: position,
          radius: 160,
          fillColor: 'rgba(239, 68, 68, 0.25)',
          strokeColor: 'rgba(239, 68, 68, 0.45)',
          strokeWeight: 1,
        });
        circlesRef.current.push(circle);

        const markerPos = marker.getPosition ? marker.getPosition() : position;
        bounds.extend(markerPos);
      });

      if (!bounds.isEmpty()) {
        mapInstance.current.fitBounds(bounds, 80);
      }

      updateHeatmap(items);
    });

    const unsubscribeScores = subscribeToScores(() => {
      if (!mapInstance.current) return;
      // TODO: render polylines based on score data once structure is defined.
      routesRef.current.forEach((route) => route.setMap(null));
      routesRef.current = [];
    });

    return () => {
      unsubscribeIncidents();
      unsubscribeScores();
      clearMarkers();
      clearHeatmap();
      routesRef.current.forEach((route) => route.setMap(null));
      routesRef.current = [];
    };
  }, [status]);

  return (
    <div className="map-view">
      {status === 'loading' && <div className="map-overlay">Loading map…</div>}
      {status === 'error' && <div className="map-overlay">Failed to load map.</div>}
      {status === 'no-key' && (
        <div className="map-overlay">
          Google Maps API key not configured. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code>.
        </div>
      )}
      {status === 'ready' && searchStatus === 'searching' && (
        <div className="map-overlay">Searching…</div>
      )}
      {status === 'ready' && searchStatus === 'no-results' && (
        <div className="map-overlay">No results found for that query.</div>
      )}
      {status === 'ready' && searchStatus === 'error' && (
        <div className="map-overlay">Search failed. Try a different query.</div>
      )}
      {status === 'ready' && !window.google?.maps?.visualization?.HeatmapLayer && (
        <div className="map-overlay">Heatmap library not available (visualization). Check your Google Maps API key and libraries.</div>
      )}
      <div ref={mapRef} className="map-container" />
    </div>
  );
}
