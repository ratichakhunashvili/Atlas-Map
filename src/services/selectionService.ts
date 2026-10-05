import type { SelectedPoi, SelectionState } from '@/types';

type Listener = (state: SelectionState) => void;

/**
 * The single source of truth for "what POI is currently selected" — kept
 * deliberately map-agnostic (no Mapbox types here) so the info panel, the
 * map's feature-state writer, and anything else that cares about selection
 * all read from one place instead of tracking their own copies.
 */
class SelectionService {
  private state: SelectionState = { feature: null };
  private listeners = new Set<Listener>();

  getState(): SelectionState {
    return this.state;
  }

  select(feature: SelectedPoi): void {
    if (this.state.feature?.id === feature.id) return; // already selected — no-op, no redundant animation
    this.state = { feature };
    this.emit();
  }

  deselect(): void {
    if (!this.state.feature) return;
    this.state = { feature: null };
    this.emit();
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}

export const selectionService = new SelectionService();
