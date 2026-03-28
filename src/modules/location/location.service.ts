import { Location } from './location.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

// Free reverse geocoding — no API key needed
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MY-EMDR-App/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.display_name ?? null;
  } catch {
    logger.warn('Reverse geocoding failed', { lat, lng });
    return null;
  }
}

export const locationService = {

  // POST — save user's current location (lat/lng only)
  async shareLocation(userId: string, data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) {
    const location = await Location.create({
      userId,
      latitude:  data.latitude,
      longitude: data.longitude,
      accuracy:  data.accuracy,
      sharedAt:  new Date(),
    });

    logger.info('Location shared', { userId, lat: data.latitude, lng: data.longitude });

    return {
      id:        location._id.toString(),
      latitude:  location.latitude,
      longitude: location.longitude,
      accuracy:  location.accuracy ?? null,
      sharedAt:  location.sharedAt,
    };
  },

  // GET — latest location + auto reverse geocode address
  async getMyLocation(userId: string) {
    const location = await Location.findOne({ userId })
      .sort({ sharedAt: -1 })
      .lean();

    if (!location) throw ApiError.notFound('No location found. Please share your location first.');

    // Reverse geocode to get human-readable address
    const address = await reverseGeocode(location.latitude, location.longitude);

    return {
      id:        location._id.toString(),
      latitude:  location.latitude,
      longitude: location.longitude,
      accuracy:  location.accuracy ?? null,
      address:   address ?? 'Address not available',
      sharedAt:  location.sharedAt,
      mapsUrl:   `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
    };
  },
};
