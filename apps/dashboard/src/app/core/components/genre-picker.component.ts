import type { GenreCatalog } from '@alcstronghold/domain';
import { ChangeDetectionStrategy, Component, computed, effect, input, model, signal, untracked } from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';

interface GenreGroup {
  parent: GenreCatalog;
  children: GenreCatalog[];
  selectedCount: number;
  hasSuggested: boolean;
}

@Component({
  selector: 'app-genre-picker',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './genre-picker.component.html',
})
export class GenrePickerComponent implements FormValueControl<string[]> {
  readonly options = input.required<GenreCatalog[]>();
  readonly suggestedIds = input<Set<string>>(new Set());
  readonly value = model<string[]>([]);

  private readonly openSections = signal(new Set<string>());

  readonly selectedIds = computed(() => new Set(this.value()));

  readonly genreGroups = computed<GenreGroup[]>(() => {
    const all = this.options();
    const selected = this.selectedIds();
    const suggested = this.suggestedIds();

    const parents = all
      .filter((g) => g.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    const childrenByParent = new Map<string, GenreCatalog[]>();
    for (const genre of all) {
      if (genre.parentId !== null) {
        const siblings = childrenByParent.get(genre.parentId) ?? [];
        siblings.push(genre);
        childrenByParent.set(genre.parentId, siblings);
      }
    }

    return parents.map((parent) => {
      const children = (childrenByParent.get(parent.id) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name, 'es')
      );
      const allItems = [parent, ...children];
      const selectedCount = allItems.filter((g) => selected.has(g.id)).length;
      const hasSuggested = allItems.some((g) => suggested.has(g.id));

      return { parent, children, selectedCount, hasSuggested };
    });
  });

  constructor() {
    // Auto-abre secciones que tienen géneros seleccionados o sugeridos
    effect(() => {
      const selected = this.selectedIds();
      const suggested = this.suggestedIds();
      const groups = untracked(() => this.genreGroups());
      const current = untracked(() => this.openSections());

      const toOpen = new Set(current);
      let changed = false;

      for (const group of groups) {
        const allIds = [group.parent.id, ...group.children.map((c) => c.id)];
        const shouldOpen = allIds.some((id) => selected.has(id) || suggested.has(id));

        if (shouldOpen && !toOpen.has(group.parent.id)) {
          toOpen.add(group.parent.id);
          changed = true;
        }
      }

      if (changed) this.openSections.set(toOpen);
    });
  }

  isOpen(parentId: string): boolean {
    return this.openSections().has(parentId);
  }

  toggleSection(parentId: string): void {
    const current = new Set(this.openSections());
    if (current.has(parentId)) {
      current.delete(parentId);
    } else {
      current.add(parentId);
    }
    this.openSections.set(current);
  }

  isSelected(genreId: string): boolean {
    return this.selectedIds().has(genreId);
  }

  toggleGenre(genreId: string): void {
    const current = this.value();
    if (this.selectedIds().has(genreId)) {
      this.value.set(current.filter((id) => id !== genreId));
    } else {
      this.value.set([...current, genreId]);
    }
  }
}
