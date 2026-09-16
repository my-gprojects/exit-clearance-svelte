import type { RoleCode } from '$lib/types';

export const ALL_ROLE_CODES: RoleCode[] = [
	'employee',
	'performance_manager',
	'ppc_hrbp',
	'ppc_ld',
	'ppc_people_services',
	'it',
	'ops',
	'finance',
	'risk_management',
	'admin'
];

export const ROLE_LABELS: Record<RoleCode, string> = {
	employee: 'Employee',
	performance_manager: 'Performance Manager',
	ppc_hrbp: 'PPC – HRBP',
	ppc_ld: 'PPC – L&D',
	ppc_people_services: 'PPC – People Services',
	it: 'IT',
	ops: 'Ops',
	finance: 'Finance',
	risk_management: 'Risk Management',
	admin: 'Admin'
};

export function roleLabel(code: string): string {
	return ROLE_LABELS[code as RoleCode] ?? code.replaceAll('_', ' ');
}

export function hasAnyRole(roles: RoleCode[] | undefined, candidates: RoleCode[]): boolean {
	if (!roles?.length) return false;
	return candidates.some((r) => roles.includes(r));
}

export function canManageCases(roles: RoleCode[] | undefined): boolean {
	return hasAnyRole(roles, ['ppc_people_services', 'admin']);
}

export function canAccessAdmin(roles: RoleCode[] | undefined): boolean {
	return hasAnyRole(roles, ['admin']);
}

export function canAccessReports(roles: RoleCode[] | undefined): boolean {
	return hasAnyRole(roles, ['ppc_people_services', 'admin']);
}

export function canActOnTask(
	user: { userId: number; roles: RoleCode[] } | null | undefined,
	task: { ownerRole: string; taskCode: string; status: string; phase: string },
	caseMeta: {
		employeeUserId: number;
		performanceManagerUserId: number | null;
		caseStatus: string;
	}
): boolean {
	if (!user) return false;
	if (task.status === 'blocked') return false;
	if (!['pending', 'in_progress'].includes(task.status)) return false;
	if (['fully_cleared', 'cancelled'].includes(caseMeta.caseStatus)) return false;

	if (task.phase === 'pre_last_day') {
		if (caseMeta.caseStatus !== 'pre_last_day_in_progress') return false;
	} else if (task.phase === 'last_working_day') {
		if (caseMeta.caseStatus !== 'last_working_day_in_progress') return false;
	} else {
		return false;
	}

	if (user.roles.includes('admin')) return true;

	if (task.ownerRole === 'employee') {
		if (caseMeta.employeeUserId === user.userId) return true;
		if (
			task.taskCode === 'knowledge_transfer_plan' &&
			caseMeta.performanceManagerUserId === user.userId
		) {
			return true;
		}
		return false;
	}

	return user.roles.includes(task.ownerRole as RoleCode);
}

export function canRollbackTask(
	user: { roles: RoleCode[] } | null | undefined,
	task: { status: string },
	caseMeta: { caseStatus: string }
): boolean {
	if (!user?.roles.includes('admin')) return false;
	if (caseMeta.caseStatus === 'cancelled') return false;
	return task.status === 'completed' || task.status === 'skipped';
}

export function statusLabel(status: string): string {
	const map: Record<string, string> = {
		initiated: 'Initiated',
		pre_last_day_in_progress: 'Before last day — in progress',
		pre_last_day_complete: 'Before last day — complete',
		last_working_day_in_progress: 'Last working day — in progress',
		fully_cleared: 'Fully cleared',
		cancelled: 'Cancelled'
	};
	return map[status] ?? status;
}

export function statusBadgeClass(status: string): string {
	const map: Record<string, string> = {
		initiated: 'bg-(--button-muted-bg) text-(--button-muted-text)',
		pre_last_day_in_progress: 'bg-(--app-surface-2) text-(--focus-ring)',
		pre_last_day_complete: 'bg-(--button-success-bg)/10 text-(--button-success-bg)',
		last_working_day_in_progress: 'bg-(--button-warning-bg)/15 text-(--button-warning-active-bg)',
		fully_cleared: 'bg-(--button-success-bg) text-(--button-success-text)',
		cancelled: 'bg-(--button-danger-bg)/10 text-(--button-danger-bg)'
	};
	return map[status] ?? 'bg-(--button-muted-bg) text-(--button-muted-text)';
}

export function progressWidthClass(completed: number, total: number): string {
	const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
	if (pct >= 100) return 'w-full';
	if (pct >= 90) return 'w-11/12';
	if (pct >= 75) return 'w-3/4';
	if (pct >= 66) return 'w-2/3';
	if (pct >= 50) return 'w-1/2';
	if (pct >= 33) return 'w-1/3';
	if (pct >= 25) return 'w-1/4';
	if (pct > 0) return 'w-1/12';
	return 'w-0';
}
