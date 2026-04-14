import { Capacitor } from '@capacitor/core';

export type LocationErrorCode = 'permission_denied' | 'services_disabled' | 'timeout' | 'unavailable';

export interface LocationResult {
  lat: number;
  lng: number;
}

export interface LocationError {
  code: LocationErrorCode;
  message: string;
}

function mapGeoError(err: GeolocationPositionError): LocationError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return { code: 'permission_denied', message: 'Location permission denied. Enable it in your browser/device settings.' };
    case err.POSITION_UNAVAILABLE:
      return { code: 'unavailable', message: 'Location is currently unavailable. Make sure location services are enabled on your device.' };
    case err.TIMEOUT:
      return { code: 'timeout', message: 'Location request timed out. Please try again.' };
    default:
      return { code: 'unavailable', message: 'Unable to determine your location.' };
  }
}

/**
 * Get current device coordinates. Uses @capacitor/geolocation on native,
 * falls back to browser geolocation on web. Retries once with lower
 * accuracy if the precise request fails.
 */
export async function getCurrentPosition(): Promise<LocationResult> {
  if (Capacitor.isNativePlatform()) {
    return getNativePosition();
  }
  return getWebPosition();
}

async function getNativePosition(): Promise<LocationResult> {
  const { Geolocation } = await import('@capacitor/geolocation');

  try {
    const permStatus = await Geolocation.requestPermissions();
    if (permStatus.location === 'denied') {
      throw { code: 'permission_denied', message: 'Location permission denied. Enable it in your device settings.' } as LocationError;
    }
  } catch (e: any) {
    if (e.code === 'permission_denied') throw e;
  }

  try {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 20000,
      });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (retryErr: any) {
      throw {
        code: 'unavailable',
        message: retryErr?.message || 'Unable to determine your location.',
      } as LocationError;
    }
  }
}

function getWebPosition(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 'unavailable', message: 'Geolocation is not supported on this device.' } as LocationError);
      return;
    }

    // On desktop browsers there's usually no GPS hardware, so high accuracy
    // often fails. We try high accuracy first, then fall back quickly.
    const tryPosition = (highAccuracy: boolean, isRetry: boolean) => {
      console.log(`[Location] Requesting position: highAccuracy=${highAccuracy}, isRetry=${isRetry}`);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('[Location] Got coordinates:', pos.coords.latitude, pos.coords.longitude);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error(`[Location] Error (code=${err.code}, retry=${isRetry}):`, err.message);
          // Retry with lower accuracy on any non-permission error
          if (!isRetry && err.code !== err.PERMISSION_DENIED) {
            tryPosition(false, true);
            return;
          }
          reject(mapGeoError(err));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 15000 : 30000,
          maximumAge: highAccuracy ? 0 : 600000,
        }
      );
    };

    tryPosition(true, false);
  });
}

/** User-friendly toast message for a LocationError */
export function locationErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as LocationError).message;
  }
  return 'Unable to determine your location.';
}
