import { createElement } from '@/utils/dom';

export interface ControlsPanelParts {
  search: HTMLElement;
  locate: HTMLElement;
  themeToggle: HTMLElement;
  statusText: HTMLElement;
}

/** Lays out the handful of controls the app needs. Pure DOM arrangement — no business logic. */
export function mountControlsPanel(root: HTMLElement, parts: ControlsPanelParts): void {
  const bar = createElement('div', 'control-bar');
  const actions = createElement('div', 'control-actions');

  actions.append(parts.locate, parts.themeToggle);
  bar.append(parts.search, actions);

  root.append(bar, parts.statusText);
}
