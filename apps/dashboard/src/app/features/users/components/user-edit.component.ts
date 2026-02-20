import type { ManagedUser } from '@alcstronghold/domain';
import { Component, computed, inject, type OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { UserManagementService } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-user-edit',
  imports: [RouterLink],
  templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly userManagement = inject(UserManagementService);

  readonly policies = this.userManagement.policies;
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  /** Estado local de policies seleccionadas (no persiste hasta guardar) */
  readonly selectedPolicyIds = signal(new Set<string>());

  readonly user = computed<ManagedUser | undefined>(() => {
    const userId = this.route.snapshot.paramMap.get('id');
    return this.userManagement.users().find(u => u.id === userId);
  });

  readonly assignedPolicyIds = computed(() => {
    const user = this.user();
    return new Set(user?.policyAssignments.map(pa => pa.policyId) ?? []);
  });

  /** Detecta si el estado local difiere de las assignments actuales */
  readonly hasChanges = computed(() => {
    const selected = this.selectedPolicyIds();
    const assigned = this.assignedPolicyIds();
    if (selected.size !== assigned.size) return true;
    for (const id of selected) {
      if (!assigned.has(id)) return true;
    }
    return false;
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.userManagement.loadUsers(),
      this.userManagement.loadPolicies(),
    ]);
    this.syncLocalState();
  }

  toggleLocalPolicy(policyId: string): void {
    const current = new Set(this.selectedPolicyIds());
    if (current.has(policyId)) {
      current.delete(policyId);
    } else {
      current.add(policyId);
    }
    this.selectedPolicyIds.set(current);
  }

  async savePolicies(): Promise<void> {
    const user = this.user();
    if (!user) return;

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const selected = this.selectedPolicyIds();
      const assigned = this.assignedPolicyIds();

      // Policies que hay que añadir (seleccionadas pero no asignadas)
      const toAdd = [...selected].filter(id => !assigned.has(id));
      // Policies que hay que quitar (asignadas pero no seleccionadas)
      const toRemove = user.policyAssignments.filter(pa => !selected.has(pa.policyId));

      await Promise.all([
        ...toAdd.map(policyId => this.userManagement.assignPolicy(user.id, policyId)),
        ...toRemove.map(pa => this.userManagement.removePolicy(pa.id)),
      ]);

      this.syncLocalState();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Error al guardar policies');
    }

    this.isSaving.set(false);
  }

  isSelected(policyId: string): boolean {
    return this.selectedPolicyIds().has(policyId);
  }

  /** Sincroniza el estado local con las assignments reales del usuario */
  private syncLocalState(): void {
    this.selectedPolicyIds.set(new Set(this.assignedPolicyIds()));
  }
}
