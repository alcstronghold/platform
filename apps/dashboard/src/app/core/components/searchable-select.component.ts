import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';

export interface SelectOption {
  value: string;
  name: string;
  preferred?: boolean;
}

/** Elimina diacríticos y normaliza a minúsculas para comparación */
function normalizeSearch(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './searchable-select.component.html',
})
export class SearchableSelectComponent implements FormValueControl<string | null> {
  private readonly elementRef = inject(ElementRef);

  readonly options = input<SelectOption[]>([]);
  readonly value = model<string | null>(null);
  readonly placeholder = input('— Sin seleccionar —');
  readonly disabled = input(false);
  readonly searchable = input(true);

  readonly searchText = signal('');
  readonly isOpen = signal(false);

  readonly searchInputRef = viewChild<ElementRef>('searchInput');

  readonly selectedOption = computed(() => this.options().find(o => o.value === this.value()) ?? null);

  readonly filteredOptions = computed(() => {
    const query = normalizeSearch(this.searchText().trim());
    return query
      ? this.options().filter(o => normalizeSearch(o.name).includes(query))
      : this.options();
  });

  readonly preferredOptions = computed(() => this.filteredOptions().filter(o => o.preferred));
  readonly otherOptions = computed(() => this.filteredOptions().filter(o => !o.preferred));

  readonly displayText = computed(() => this.selectedOption()?.name ?? '');

  toggleDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      setTimeout(() => this.searchInputRef()?.nativeElement.focus(), 0);
    } else {
      this.searchText.set('');
    }
  }

  select(value: string | null): void {
    this.value.set(value);
    this.searchText.set('');
    this.isOpen.set(false);
  }

  clear(): void {
    this.select(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.searchText.set('');
    }
  }
}
