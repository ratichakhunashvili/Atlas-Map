import { createElement } from '@/utils/dom';
import { selectionService } from '@/services/selectionService';

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & drink',
  hotel: 'Hotel',
  culture: 'Culture',
  nature: 'Nature',
  health: 'Health',
  shopping: 'Shopping',
  transport: 'Transport',
  religious: 'Religious site',
  sports: 'Sports',
  services: 'Services',
  other: 'Place',
};

export interface InfoPanel {
  element: HTMLDivElement;
}

/** The general info panel for a selected POI — the same panel opens whether the selection came from a 3D grow or a 2D highlight. */
export function createInfoPanel(): InfoPanel {
  const element = createElement('div', 'info-panel', { role: 'dialog', 'aria-live': 'polite' });
  element.hidden = true;

  const closeButton = createElement('button', 'info-panel-close', {
    type: 'button',
    'aria-label': 'Close',
  });
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => selectionService.deselect());

  const title = createElement('div', 'info-panel-title');
  const subtitle = createElement('div', 'info-panel-subtitle');

  element.append(closeButton, title, subtitle);

  selectionService.onChange((state) => {
    if (!state.feature) {
      element.hidden = true;
      return;
    }
    title.textContent = state.feature.properties.name;
    subtitle.textContent = CATEGORY_LABELS[state.feature.properties.category] ?? 'Place';
    element.hidden = false;
  });

  return { element };
}
