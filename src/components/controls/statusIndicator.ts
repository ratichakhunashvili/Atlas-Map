import { createElement } from '@/utils/dom';
import type { LocationState } from '@/types';

const MESSAGES: Partial<Record<LocationState['status'], string>> = {
  locating: 'Finding your location…',
  denied: 'Location access denied — map still works',
  unavailable: 'Location unavailable',
  timeout: 'Location timed out',
  unsupported: 'Location not supported on this browser',
  error: 'Location error',
};

export interface StatusIndicator {
  element: HTMLDivElement;
  update: (state: LocationState) => void;
}

export function createStatusIndicator(): StatusIndicator {
  const element = createElement('div', 'status-indicator', { role: 'status', 'aria-live': 'polite' });
  element.hidden = true;

  const update = (state: LocationState): void => {
    const message = MESSAGES[state.status];
    if (!message) {
      element.hidden = true;
      return;
    }
    element.textContent = message;
    element.hidden = false;
    element.dataset.status = state.status;
  };

  return { element, update };
}
