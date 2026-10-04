import type { Coordinates, LocationState, LocationStatus } from '@/types';
import { distanceMeters } from '@/utils/geo';
import { LOCATION_MARKER_THRESHOLD_M } from '@/map/mapConfig';

type Listener = (state: LocationState) => void;

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 30000,
};

const FIRST_FIX_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};

function statusFromError(error: GeolocationPositionError): LocationStatus {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'denied';
    case error.POSITION_UNAVAILABLE:
      return 'unavailable';
    case error.TIMEOUT:
      return 'timeout';
    default:
      return 'error';
  }
}

class LocationService {
  private state: LocationState = {
    status: 'idle',
    coords: null,
    accuracy: null,
    timestamp: null,
  };

  private listeners = new Set<Listener>();
  private watchId: number | null = null;

  getState(): LocationState {
    return this.state;
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(partial: LocationState): void {
    this.state = partial;
    for (const listener of this.listeners) listener(this.state);
  }

  /** Call once at startup. Gets a first fix, then keeps a low-power watch running. */
  start(): void {
    if (this.watchId !== null) return;

    if (!('geolocation' in navigator)) {
      this.setState({ status: 'unsupported', coords: null, accuracy: null, timestamp: null });
      return;
    }

    this.setState({ status: 'locating', coords: null, accuracy: null, timestamp: null });

    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePosition(position),
      (error) => this.setState({
        status: statusFromError(error),
        coords: null,
        accuracy: null,
        timestamp: null,
        message: error.message,
      }),
      FIRST_FIX_OPTIONS,
    );

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => {
        // A transient watch error shouldn't erase a location we already have.
        if (!this.state.coords) {
          this.setState({
            status: statusFromError(error),
            coords: null,
            accuracy: null,
            timestamp: null,
            message: error.message,
          });
        }
      },
      WATCH_OPTIONS,
    );
  }

  /** Explicit re-request, for the "locate me" button — works even if the passive watch never got a fix (e.g. permission was granted after an initial denial). */
  requestOnce(): void {
    if (!('geolocation' in navigator)) {
      this.setState({ status: 'unsupported', coords: null, accuracy: null, timestamp: null });
      return;
    }

    this.setState({ status: 'locating', coords: this.state.coords, accuracy: this.state.accuracy, timestamp: this.state.timestamp });

    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePosition(position, true),
      (error) => this.setState({
        status: statusFromError(error),
        coords: null,
        accuracy: null,
        timestamp: null,
        message: error.message,
      }),
      FIRST_FIX_OPTIONS,
    );
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private handlePosition(position: GeolocationPosition, force = false): void {
    const next: Coordinates = {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
    };

    const previous = this.state.coords;
    const movedEnough = !previous || distanceMeters(previous, next) >= LOCATION_MARKER_THRESHOLD_M;

    if (!force && !movedEnough && this.state.status === 'active') {
      return; // GPS jitter — not worth a re-render
    }

    this.setState({
      status: 'active',
      coords: next,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
  }
}

export const locationService = new LocationService();
