import { logger } from '@/lib/logger';
export interface Hub {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  publicTransitDirections?: string;
}

export interface HubMatch {
  hub: Hub;
  distance: number;
  distanceText: string;
}

export const HUBS: Hub[] = [
  {
    "name": "Bronx Adult Learning Center",
    "address": "3450 East Tremont Avenue, 3rd Floor, Bronx, NY 10465",
    "latitude": 40.8405,
    "longitude": -73.8795
  },
  {
    "name": "P.S. 9 Ryer Avenue Elementary School",
    "address": "230 E 183rd St, Bronx, NY 10457",
    "latitude": 40.8583,
    "longitude": -73.9039
  },
  {
    "name": "P.S. 53 The Basheer Quisim School",
    "address": "360 E 168th St, Bronx, NY 10456",
    "latitude": 40.8300,
    "longitude": -73.9140
  },
  {
    "name": "J.H.S. 022 Jordan L. Mott",
    "address": "270 E 167th St, Bronx, NY 10456",
    "latitude": 40.8285,
    "longitude": -73.9124
  },
  {
    "name": "Adult Education School 6 at P.S. 13 Roberto Clemente",
    "address": "557 Pennsylvania Avenue, Brooklyn, NY 11207",
    "latitude": 40.6719,
    "longitude": -73.9201
  },
  {
    "name": "Adult Education School 6 at Coney Island Avenue",
    "address": "1223 Coney Island Avenue, Brooklyn, NY 11230",
    "latitude": 40.6311,
    "longitude": -73.9620,
    "publicTransitDirections": "## Subway\n\n### Q Train (closest, about 8–10 minutes)\n\n- Take the Q train to **Avenue H** (or Avenue J).\n- Exit towards Avenue H and walk west toward Coney Island Avenue (about 3 blocks).\n- Turn left onto Coney Island Avenue. The building is on your left between Avenue H and Avenue I.\n\n### B or Q Train to Newkirk Plaza (about 12–14 minutes)\n\n- Take the B (weekday express) or Q train to **Newkirk Plaza**.\n- Walk west along Newkirk Avenue to Coney Island Avenue, then turn left and walk to Avenue H / Avenue I.\n\n### F Train (about 12–15 minutes)\n\n- Take the F train to **Avenue I** (at McDonald Avenue).\n- Walk east on Avenue I until Coney Island Avenue, then turn left.\n\n## Bus\n\n### B68 (along Coney Island Avenue)\n\n- The B68 runs north-south on Coney Island Avenue.\n- Get off at **Coney Island Ave / Avenue H** or **Coney Island Ave / Avenue I**. The building is across or down the block.\n\n### B8 (crosstown connection)\n\n- Runs along 18th Avenue and Foster Avenue.\n- Transfer to the southbound B68 on Coney Island Avenue, or walk south from Foster Avenue (about 8 minutes)."
  },
  {
    "name": "Melrose Alternate Learning Center",
    "address": "271 Melrose Street, Brooklyn, NY 11206",
    "latitude": 40.7024,
    "longitude": -73.9501
  },
  {
    "name": "Public School 6",
    "address": "43 Snyder Ave, Brooklyn, NY 11226",
    "latitude": 40.6438,
    "longitude": -73.9624
  },
  {
    "name": "Bushwick High School",
    "address": "400 Irving Ave, Brooklyn, NY 11237",
    "latitude": 40.6998,
    "longitude": -73.9104
  },
  {
    "name": "Brooklyn Adult Learning Center",
    "address": "475 Nostrand Avenue, Brooklyn, NY 11216",
    "latitude": 40.6839,
    "longitude": -73.9528
  },
  {
    "name": "South Shore High School",
    "address": "6565 Flatlands Ave, Brooklyn, NY 11236",
    "latitude": 40.6375,
    "longitude": -73.8986
  },
  {
    "name": "Manhattan Hub",
    "address": "269 West 35th Street, 7th Floor, Room 720, New York, NY 10015",
    "latitude": 40.7527,
    "longitude": -73.9940
  },
  {
    "name": "Mid-Manhattan Adult Learning Center",
    "address": "212 West 120th Street, New York, NY 10027",
    "latitude": 40.8075,
    "longitude": -73.9504
  },
  {
    "name": "Staten Island Adult Learning Center",
    "address": "365 Bay St, Staten Island, NY 10301",
    "latitude": 40.6441,
    "longitude": -74.0760
  }
];

/**
 * Calculate the distance between two points using the Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 5280)} feet`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} miles`;
  } else {
    return `${Math.round(distance)} miles`;
  }
}

/**
 * Find the closest hub to the given coordinates
 */
function normalizeHubName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function findHubByName(name?: string | null): Hub | undefined {
  if (!name) return undefined;

  const exact = HUBS.find((hub) => hub.name === name);
  if (exact) return exact;

  const needle = normalizeHubName(name);
  const contains = HUBS.filter((hub) => {
    const hay = normalizeHubName(hub.name);
    return hay.includes(needle) || needle.includes(hay);
  });
  if (contains.length === 1) return contains[0];

  const tokens = needle
    .split(' ')
    .filter((token) => token.length > 3 && !['adult', 'education', 'school', 'learning', 'center'].includes(token));

  let best: Hub | undefined;
  let bestScore = 0;
  for (const hub of HUBS) {
    const hay = normalizeHubName(hub.name);
    const score = tokens.filter((token) => hay.includes(token)).length;
    if (score > bestScore) {
      bestScore = score;
      best = hub;
    }
  }

  return bestScore >= 2 ? best : undefined;
}

export function findClosestHub(latitude: number, longitude: number): HubMatch {
  let closestHub = HUBS[0];
  let shortestDistance = calculateDistance(latitude, longitude, closestHub.latitude, closestHub.longitude);

  for (const hub of HUBS) {
    const distance = calculateDistance(latitude, longitude, hub.latitude, hub.longitude);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestHub = hub;
    }
  }

  return {
    hub: closestHub,
    distance: shortestDistance,
    distanceText: formatDistance(shortestDistance)
  };
}

/**
 * Geocode an address using Mapbox API
 */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      logger.error('Mapbox token not found');
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=US&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      logger.error('Geocoding response not ok:', response.status, response.statusText);
      throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      const result = {
        latitude: latitude,
        longitude: longitude
      };
      return result;
    }
    return null;
  } catch (error) {
    logger.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Find closest hub for a given address
 */
export async function findClosestHubForAddress(address: string): Promise<HubMatch | null> {
  const coordinates = await geocodeAddress(address);
  
  if (!coordinates) {
    return null;
  }

  return findClosestHub(coordinates.latitude, coordinates.longitude);
} 