import { createElement } from '@/utils/dom';
import { debounce } from '@/utils/debounce';
import { SEARCH_DEBOUNCE_MS } from '@/map/mapConfig';
import type { SearchSuggestion } from '@/types';

export interface SearchControl {
  element: HTMLDivElement;
}

export interface SearchControlOptions {
  onQuery: (query: string) => Promise<SearchSuggestion[]>;
  onSelect: (suggestion: SearchSuggestion) => void;
}

export function createSearchControl({ onQuery, onSelect }: SearchControlOptions): SearchControl {
  const wrapper = createElement('div', 'search-control');
  const input = createElement('input', 'search-input', {
    type: 'text',
    placeholder: 'Search Georgia…',
    'aria-label': 'Search places in Georgia',
    autocomplete: 'off',
  });
  const list = createElement('ul', 'search-results', { role: 'listbox' });
  list.hidden = true;

  let suggestions: SearchSuggestion[] = [];
  let activeIndex = -1;

  const closeList = (): void => {
    list.hidden = true;
    list.innerHTML = '';
    suggestions = [];
    activeIndex = -1;
  };

  const renderList = (): void => {
    list.innerHTML = '';
    suggestions.forEach((suggestion, index) => {
      const item = createElement('li', 'search-result-item', { role: 'option' });
      item.classList.toggle('active', index === activeIndex);
      const title = createElement('span', 'search-result-name');
      title.textContent = suggestion.name;
      const subtitle = createElement('span', 'search-result-place');
      subtitle.textContent = suggestion.placeFormatted;
      item.append(title, subtitle);
      item.addEventListener('mousedown', (event) => {
        event.preventDefault();
        select(suggestion);
      });
      list.appendChild(item);
    });
    list.hidden = suggestions.length === 0;
  };

  const select = (suggestion: SearchSuggestion): void => {
    input.value = suggestion.name;
    closeList();
    onSelect(suggestion);
  };

  const runQuery = debounce(async (query: string) => {
    if (!query.trim()) {
      closeList();
      return;
    }
    try {
      suggestions = await onQuery(query);
      activeIndex = -1;
      renderList();
    } catch (error) {
      console.error('[searchControl] query failed', error);
    }
  }, SEARCH_DEBOUNCE_MS);

  input.addEventListener('input', () => runQuery(input.value));

  input.addEventListener('keydown', (event) => {
    if (list.hidden || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
      renderList();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
      renderList();
    } else if (event.key === 'Enter') {
      const chosen = suggestions[activeIndex] ?? suggestions[0];
      if (chosen) select(chosen);
    } else if (event.key === 'Escape') {
      closeList();
      input.blur();
    }
  });

  input.addEventListener('blur', () => {
    // Delay so a click on a result (mousedown) fires before we hide the list.
    setTimeout(closeList, 120);
  });

  wrapper.append(input, list);
  return { element: wrapper };
}
