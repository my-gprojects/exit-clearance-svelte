/**
 * Static JSON data access.
 * Swap this module later for SQL Server / PostgreSQL without changing routes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExitCase, ExitTask, NavItem, Note, PublicUser, RoleCode, StoredUser } from '$lib/types';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../data');

type UsersFile = { users: StoredUser[] };
type CasesFile = { cases: ExitCase[]; tasks: ExitTask[] };
type AppFile = { navigation: NavItem[]; notes: Note[] };

function readJson<T>(name: string): T {
	return JSON.parse(readFileSync(join(root, name), 'utf8')) as T;
}

function writeJson(name: string, data: unknown) {
	writeFileSync(join(root, name), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function listUsers(): StoredUser[] {
	return readJson<UsersFile>('users.json').users;
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
	const file = readJson<UsersFile>('users.json');
	const idx = file.users.findIndex((u) => u.userId === userId);
	if (idx < 0) return null;
	file.users[idx] = { ...file.users[idx], roles: [...roles] };
	writeJson('users.json', file);
	return toPublicUser(file.users[idx]);
}

export function listCases(): ExitCase[] {
	return readJson<CasesFile>('cases.json').cases;
}

export function getCase(exitCaseId: number): ExitCase | undefined {
	return listCases().find((c) => c.exitCaseId === exitCaseId);
}

export function listTasks(): ExitTask[] {
	return readJson<CasesFile>('cases.json').tasks;
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
	const app = readJson<AppFile>('app.json');
	return app.navigation
		.filter((n) => n.isActive && (!n.adminOnly || user.roles.includes('admin')))
		.sort((a, b) => a.sortNumber - b.sortNumber);
}

export function notesForUser(userId: number): Note[] {
	return readJson<AppFile>('app.json')
		.notes.filter((n) => n.userId === userId)
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
