/**
 * Calculate distance between two geographic coordinates using the Haversine formula.
 * @param {Object} coord1 - First coordinate {lat, lng}
 * @param {Object} coord2 - Second coordinate {lat, lng}
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a coordinate is within a specified radius of another coordinate.
 * @param {Object} center - Center coordinate {lat, lng}
 * @param {Object} point - Point to check {lat, lng}
 * @param {number} radiusKm - Radius in kilometers (default: 1)
 * @returns {boolean}
 */
export function isWithinRadius(center, point, radiusKm = 1) {
  if (!center || !point) return false;
  if (center.lat == null || center.lng == null) return false;
  if (point.lat == null || point.lng == null) return false;
  
  const distance = calculateDistance(center, point);
  return distance <= radiusKm;
}
