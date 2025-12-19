// Geocoding utilities for address coordinate conversion
// In production, you would use a real geocoding service like Google Maps API

import { env } from "@/env/server";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

// Mock geocoding function - replace with actual service in production
const geocodeAddressDev = async (address: {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}): Promise<GeocodeResult | null> => {
  // This is a mock implementation
  // In production, use Google Maps Geocoding API or similar service

  // For demo purposes, return approximate coordinates for major Canadian cities
  const cityCoordinates: { [key: string]: GeocodeResult } = {
    toronto: { latitude: 43.6532, longitude: -79.3832 },
    vancouver: { latitude: 49.2827, longitude: -123.1207 },
    montreal: { latitude: 45.5017, longitude: -73.5673 },
    calgary: { latitude: 51.0447, longitude: -114.0719 },
    ottawa: { latitude: 45.4215, longitude: -75.6972 },
    edmonton: { latitude: 53.5461, longitude: -113.4938 },
    mississauga: { latitude: 43.589, longitude: -79.6441 },
    winnipeg: { latitude: 49.8951, longitude: -97.1384 },
    "quebec city": { latitude: 46.8139, longitude: -71.208 },
    hamilton: { latitude: 43.2557, longitude: -79.8711 },
  };

  const cityKey = address.city.toLowerCase();
  const coordinates = cityCoordinates[cityKey];

  if (coordinates) {
    // Add some random variation to simulate specific addresses
    return {
      latitude: coordinates.latitude + (Math.random() - 0.5) * 0.1,
      longitude: coordinates.longitude + (Math.random() - 0.5) * 0.1,
    };
  }

  // Default to Toronto area if city not found
  return {
    latitude: 43.6532 + (Math.random() - 0.5) * 0.1,
    longitude: -79.3832 + (Math.random() - 0.5) * 0.1,
  };
};

// Production implementation would look like this:

const geocodeAddressGoogle = async (address: {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}): Promise<GeocodeResult | null> => {
  const addressString = `${address.street}, ${address.city}, ${address.province} ${address.postalCode}, ${address.country || "Canada"}`;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${env.GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

const geocodeAddressLocationIQ = async (address: {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}): Promise<GeocodeResult | null> => {
  const addressString = `${address.street}, ${address.city}, ${address.province} ${address.postalCode}, ${address.country || "Canada"}`;

  try {
    const response = await fetch(
      `https://us1.locationiq.com/v1/search.php?key=${env.LOCATIONIQ_API_KEY}&q=${encodeURIComponent(addressString)}&format=json`
    );
    console.log(response);
    const data = await response.json();

    if (!data.length) {
      throw new Error("No results");
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export const geocodeAddress =
  process.env.NODE_ENV !== "production"
    ? geocodeAddressDev
    : geocodeAddressGoogle || geocodeAddressLocationIQ;
