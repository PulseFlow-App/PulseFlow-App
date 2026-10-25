import type { MessageKey } from "@/lib/i18n";

export type DevicePosition = { lat: number; lng: number };

/** Map browser geolocation errors to talent copy keys. */
export function geoErrorMessageKey(err: GeolocationPositionError): MessageKey {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "talent.geoDenied";
    case err.POSITION_UNAVAILABLE:
      return "talent.geoUnavailable";
    case err.TIMEOUT:
      return "talent.geoTimeout";
    default:
      return "talent.geoUnavailable";
  }
}

function syntheticGeoError(
  code: 1 | 2 | 3,
  message: string,
): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  };
}

/**
 * Read the device location. Tries a fast coarse fix first, then a higher-
 * accuracy pass so “Near me” works when GPS is slow or permission UX is flaky.
 */
export function getDevicePosition(): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(syntheticGeoError(2, "geolocation unavailable"));
      return;
    }
    if (!window.isSecureContext) {
      reject(syntheticGeoError(2, "insecure context"));
      return;
    }

    const finish = (pos: GeolocationPosition) => {
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    };

    const coarse: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 60_000,
    };
    const precise: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 30_000,
    };

    navigator.geolocation.getCurrentPosition(
      finish,
      (firstErr) => {
        // Permission denied will not succeed on retry — surface immediately.
        if (firstErr.code === firstErr.PERMISSION_DENIED) {
          reject(firstErr);
          return;
        }
        navigator.geolocation.getCurrentPosition(finish, reject, precise);
      },
      coarse,
    );
  });
}
