import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import type { CatalogItem } from '@alcstronghold/domain';

@Component({
  selector: 'app-toggle-option-list',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toggle-option-list.component.html',
  host: { class: 'flex flex-col gap-2' },
})
export class ToggleOptionListComponent implements FormValueControl<string[]> {
  readonly options = input.required<CatalogItem[]>();
  readonly value = model<string[]>([]);

  readonly selectedIds = computed(() => new Set(this.value()));

  isSelected(item: CatalogItem): boolean {
    return this.selectedIds().has(item.id);
  }

  toggle(item: CatalogItem): void {
    const current = this.value();
    const isCurrentlySelected = this.selectedIds().has(item.id);

    if (item.exclusive) {
      // Selección exclusiva: si ya estaba seleccionado, deseleccionar; si no, seleccionar solo este
      this.value.set(isCurrentlySelected ? [] : [item.id]);
      return;
    }

    // Quitar cualquier exclusivo que hubiera seleccionado antes
    const exclusiveIds = new Set(this.options().filter(o => o.exclusive).map(o => o.id));
    const withoutExclusives = current.filter(id => !exclusiveIds.has(id));

    if (isCurrentlySelected) {
      this.value.set(withoutExclusives.filter(id => id !== item.id));
    } else {
      this.value.set([...withoutExclusives, item.id]);
    }
  }
}
