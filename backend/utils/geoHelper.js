// utils/geoHelper.js
const District = require('../models/District');
const axios = require('axios');

class GeoHelper {
  // Find district by coordinates using MongoDB geospatial query
  static async findDistrictByCoordinates(longitude, latitude) {
    try {
      const district = await District.findOne({
        geo_boundary: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          }
        }
      });

      return district;
    } catch (err) {
      console.error('Geolocation query error:', err.message);
      return null;
    }
  }

  // Point-in-polygon check (fallback if MongoDB query fails)
  static isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }

  // Find nearest district if exact match not found
  static async findNearestDistrict(longitude, latitude, maxDistance = 50000) {
    try {
      const districts = await District.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            distanceField: 'distance',
            maxDistance: maxDistance, // in meters (50km)
            spherical: true
          }
        },
        { $limit: 1 }
      ]);

      return districts.length > 0 ? districts[0] : null;
    } catch (err) {
      console.error('Nearest district query error:', err.message);
      return null;
    }
  }

  // Validate coordinates
  static validateCoordinates(longitude, latitude) {
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lon) || isNaN(lat)) {
      return { valid: false, error: 'Invalid coordinate format' };
    }

    if (lon < -180 || lon > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }

    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }

    return { valid: true, longitude: lon, latitude: lat };
  }

  // Get district boundaries for map rendering
  static async getDistrictBoundaries(districtId) {
    try {
      const district = await District.findById(districtId).select('geo_boundary');
      return district?.geo_boundary || null;
    } catch (err) {
      console.error('Get boundaries error:', err.message);
      return null;
    }
  }

  // Calculate distance between two points (Haversine formula)
  static calculateDistance(lon1, lat1, lon2, lat2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  static async reverseGeocode(latitude, longitude) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${28.6139}&lon=${77.2090}&format=json`;

      const { data } = await axios.get(url, {
        headers: { "User-Agent": "ManregaApp/1.0" }
      });

      return {
        data : data,
        state: data?.address?.state,
        district: data?.address?.district || data?.address?.county
      };
    } catch (err) {
      console.error("Reverse geocode error:", err.message);
      return null;
    }
  }
}

module.exports = GeoHelper;