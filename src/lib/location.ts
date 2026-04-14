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

function mapGeoError(err: Pick<GeolocationPositionError, 'code' | 'message'>): LocationError {
  const message = err.message?.trim();

  switch (err.code) {
    case 1:
      return {
        code: 'permission_denied',
        message: message || 'Location permission denied. Enable it in your browser/device settings.',
      };
    case 2:
      return {
        code: 'unavailable',
        message:
          message ||
          'Location is currently unavailable. On desktop, allow browser location access and make sure your system location services are turned on.',
      };
    case 3:
      return { code: 'timeout', message: message || 'Location request timed out. Please try again.' };
    default:
      return {
        code: 'unavailable',
        message:
          message ||
          'Unable to determine your location. On desktop, try allowing browser location access or enter your city manually.',
      };
  }
}

function isLikelyDesktopWeb(): boolean {
  if (typeof window === 'undefined') return false;

  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return !hasCoarsePointer && !mobileUserAgent;
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

    const desktopStrategy = isLikelyDesktopWeb();
    const attempts = desktopStrategy
      ? [
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 900000, label: 'desktop-coarse' },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, label: 'desktop-precise' },
        ]
      : [
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, label: 'mobile-precise' },
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 600000, label: 'mobile-coarse' },
        ];

    const tryPosition = (attemptIndex: number) => {
      const attempt = attempts[attemptIndex];

      if (!attempt) {
        reject({
          code: 'unavailable',
          message: 'Unable to determine your location. On desktop, try allowing browser location access or enter your city manually.',
        } as LocationError);
        return;
      }

      console.log(
        `[Location] Requesting position: strategy=${attempt.label}, highAccuracy=${attempt.enableHighAccuracy}, attempt=${attemptIndex + 1}`
      );

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('[Location] Got coordinates:', pos.coords.latitude, pos.coords.longitude);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error(`[Location] Error (code=${err.code}, strategy=${attempt.label}):`, err.message);

          if (err.code === 1 || attemptIndex === attempts.length - 1) {
            reject(mapGeoError(err));
            return;
          }

          tryPosition(attemptIndex + 1);
        },
        {
          enableHighAccuracy: attempt.enableHighAccuracy,
          timeout: attempt.timeout,
          maximumAge: attempt.maximumAge,
        }
      );
    };

    tryPosition(0);
  });
}

/** User-friendly toast message for a LocationError */
export function locationErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as LocationError).message;
  }
  return 'Unable to determine your location.';
}
