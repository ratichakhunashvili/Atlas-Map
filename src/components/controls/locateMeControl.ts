import { createElement } from '@/utils/dom';
import type { LocationStatus } from '@/types';

const ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="3"/>
  <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
</svg>`;

export interface LocateMeControl {
  element: HTMLButtonElement;
  setStatus: (status: LocationStatus) => void;
}

export function createLocateMeControl(onClick: () => void): LocateMeControl {
  const button = createElement('button', 'map-control-btn locate-btn', {
    type: 'button',
    'aria-label': 'Locate me',
    title: 'Locate me',
  });
  button.innerHTML = ICON;
  button.addEventListener('click', onClick);

  const setStatus = (status: LocationStatus): void => {
    button.dataset.status = status;
  };

  return { element: button, setStatus };
}
