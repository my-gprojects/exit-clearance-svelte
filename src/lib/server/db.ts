/**
 * Static JSON data access (bundled — works on Vercel serverless).
 * Swap this module later for SQL Server / PostgreSQL without changing routes.
 */
import usersData from '../../data/users.json';
import casesData from '../../data/cases.json';
import appData from '../../data/app.json';
import type { ExitCase, ExitTask, NavItem, Note, PublicUser, RoleCode, StoredUser } from '$lib/types';

type UsersFile = { users: StoredUser[] };
type CasesFile = { cases: ExitCase[]; tasks: ExitTask[] };
type AppFile = { navigation: NavItem[]; notes: Note[] };

/** In-memory copies so admin role edits work in a single serverless invocation. */
const usersStore: UsersFile = structuredClone(usersData as UsersFile);
const casesStore: CasesFile = structuredClone(casesData as CasesFile);
const appStore: AppFile = structuredClone(appData as AppFile);

export function listUsers(): StoredUser[] {
	return usersStore.users;
}

export function findUserByUsername(username: string): StoredUser | undefined {
	const key = username.trim().toLowerCase();
	return listUsers().find((u) => u.username.toLowerCase() === key);
}

export function findUserById(userId: number): StoredUser | undefined {
	return listUsers().find((u) => u.userId === userId);
}

export function toPublicUser(u: StoredUser): PublicUser {
	const { password: _pw, isActive: _active, ...rest } = u;
	return rest;
}

export function searchUsers(query: string, max = 20): PublicUser[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	return listUsers()
		.filter(
			(u) =>
				u.username.toLowerCase().includes(q) ||
				u.displayName.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q)
		)
		.slice(0, max)
		.map(toPublicUser);
}

export function setUserRoles(userId: number, roles: RoleCode[]): PublicUser | null {
	const idx = usersStore.users.findIndex((u) => u.userId === userId);
	if (idx < 0) return null;
	usersStore.users[idx] = { ...usersStore.users[idx], roles: [...roles] };
	return toPublicUser(usersStore.users[idx]);
}

export function listCases(): ExitCase[] {
	return casesStore.cases;
}

export function getCase(exitCaseId: number): ExitCase | undefined {
	return listCases().find((c) => c.exitCaseId === exitCaseId);
}

export function listTasks(): ExitTask[] {
	return casesStore.tasks;
}

export function tasksForCase(exitCaseId: number): ExitTask[] {
	return listTasks()
		.filter((t) => t.exitCaseId === exitCaseId)
		.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function casesForUser(user: PublicUser): ExitCase[] {
	const manage = user.roles.includes('admin') || user.roles.includes('ppc_people_services');
	const cases = listCases();
	if (manage) return cases;
	return cases.filter((c) => c.employeeUserId === user.userId);
}

export function queueForUser(user: PublicUser): Array<ExitTask & { caseNumber: string; lastWorkingDay: string; employeeDisplayName: string }> {
	const cases = listCases();
	const users = listUsers();
	return listTasks()
		.filter((t) => {
			if (!['pending', 'in_progress'].includes(t.status)) return false;
			if (t.assignedUserId === user.userId) return true;
			return user.roles.includes(t.ownerRole as RoleCode);
		})
		.map((t) => {
			const c = cases.find((x) => x.exitCaseId === t.exitCaseId);
			const emp = users.find((u) => u.userId === c?.employeeUserId);
			return {
				...t,
				caseNumber: c?.caseNumber ?? '',
				lastWorkingDay: c?.lastWorkingDay ?? '',
				employeeDisplayName: emp?.displayName ?? ''
			};
		});
}

export function navigationForUser(user: PublicUser): NavItem[] {
	return appStore.navigation
		.filter((n) => n.isActive && (!n.adminOnly || user.roles.includes('admin')))
		.sort((a, b) => a.sortNumber - b.sortNumber);
}

export function notesForUser(userId: number): Note[] {
	return appStore.notes
		.filter((n) => n.userId === userId)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function dashboardSummary(user: PublicUser) {
	const cases = casesForUser(user);
	const open = cases.filter((c) => !['cancelled', 'fully_cleared'].includes(c.status));
	const today = new Date().toISOString().slice(0, 10);
	return {
		openCases: open.length,
		lwdToday: open.filter((c) => c.lastWorkingDay === today).length,
		lwdAtRisk: open.filter((c) => c.lastWorkingDay <= today).length,
		pendingQueue: queueForUser(user).length
	};
}
