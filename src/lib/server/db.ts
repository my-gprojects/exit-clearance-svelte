/**
 * Static JSON data access (in-memory, Vercel-safe).
 */
import usersData from '../../data/users.json';
import casesData from '../../data/cases.json';
import appData from '../../data/app.json';
import { canAccessAdmin, canAccessReports, canManageCases } from '$lib/roles';
import type {
	AppNotification,
	AuditRow,
	ExitCase,
	ExitTask,
	InterviewerMapRow,
	NavItem,
	Note,
	PipelineRow,
	PublicUser,
	QueueTask,
	ReportSummary,
	RoleCode,
	SlaRow,
	StoredUser,
	TaskAgingRow,
	TaskAttachment,
	TaskTemplateAdmin,
	UserSearchHit
} from '$lib/types';

type UsersFile = { users: StoredUser[] };
type CasesFile = { cases: ExitCase[]; tasks: ExitTask[] };
type AppFile = {
	navigation: NavItem[];
	notes: Note[];
	notifications: AppNotification[];
	interviewers: InterviewerMapRow[];
	taskTemplates: TaskTemplateAdmin[];
	attachments: TaskAttachment[];
	audit: AuditRow[];
};

const usersStore: UsersFile = structuredClone(usersData as UsersFile);
const casesStore: CasesFile = structuredClone(casesData as CasesFile);
const appStore: AppFile = structuredClone(appData as AppFile);

let nextAttachmentId = Math.max(0, ...appStore.attachments.map((a) => a.attachmentId)) + 1;
let nextAuditId = Math.max(0, ...appStore.audit.map((a) => a.auditId)) + 1;
let nextMapId = Math.max(0, ...appStore.interviewers.map((i) => i.mapId)) + 1;

function refreshCaseSummary(exitCaseId: number) {
	const c = casesStore.cases.find((x) => x.exitCaseId === exitCaseId);
	if (!c) return;
	const tasks = casesStore.tasks.filter((t) => t.exitCaseId === exitCaseId);
	const summarize = (phase?: string) => {
		const subset = phase ? tasks.filter((t) => t.phase === phase) : tasks;
		return {
			total: subset.length,
			completed: subset.filter((t) => t.status === 'completed').length,
			skipped: subset.filter((t) => t.status === 'skipped').length
		};
	};
	c.tasksSummary = {
		overall: summarize(),
		preLastDay: summarize('pre_last_day'),
		lastWorkingDay: summarize('last_working_day')
	};
}

function pushAudit(
	exitCaseId: number,
	action: string,
	opts: {
		statusBefore?: string | null;
		statusAfter?: string | null;
		taskTitle?: string | null;
		actorDisplayName?: string | null;
	} = {}
) {
	const c = getCase(exitCaseId);
	appStore.audit.unshift({
		auditId: nextAuditId++,
		exitCaseId,
		caseNumber: c?.caseNumber ?? '',
		action,
		statusBefore: opts.statusBefore ?? null,
		statusAfter: opts.statusAfter ?? null,
		taskTitle: opts.taskTitle ?? null,
		createdAt: new Date().toISOString(),
		actorDisplayName: opts.actorDisplayName ?? null
	});
}

function allowAttachmentsFor(taskCode: string): boolean {
	return (
		appStore.taskTemplates.find((t) => t.taskCode === taskCode)?.allowAttachments ?? false
	);
}

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

export function searchUsers(query: string, max = 20): UserSearchHit[] {
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
		.map((u) => ({
			userId: u.userId,
			username: u.username,
			displayName: u.displayName,
			email: u.email,
			department: u.department
		}));
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

export function getTask(taskId: number): ExitTask | undefined {
	return listTasks().find((t) => t.taskId === taskId);
}

export function tasksForCase(exitCaseId: number): ExitTask[] {
	return listTasks()
		.filter((t) => t.exitCaseId === exitCaseId)
		.map((t) => ({
			...t,
			allowAttachments: t.allowAttachments ?? allowAttachmentsFor(t.taskCode),
			attachmentCount:
				t.attachmentCount ??
				appStore.attachments.filter((a) => a.taskId === t.taskId).length,
			notes: t.notes ?? null
		}))
		.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function casesForUser(user: PublicUser): ExitCase[] {
	const manage = canManageCases(user.roles);
	const cases = listCases();
	if (manage) return cases;
	return cases.filter((c) => c.employeeUserId === user.userId);
}

export function queueForUser(user: PublicUser): QueueTask[] {
	const cases = listCases();
	const users = listUsers();
	return listTasks()
		.filter((t) => {
			if (!['pending', 'in_progress'].includes(t.status)) return false;
			if (t.assignedUserId === user.userId) return true;
			return user.roles.includes(t.ownerRole as RoleCode) || user.roles.includes('admin');
		})
		.map((t) => {
			const c = cases.find((x) => x.exitCaseId === t.exitCaseId);
			const emp = users.find((u) => u.userId === c?.employeeUserId);
			return {
				...t,
				caseNumber: c?.caseNumber ?? '',
				caseStatus: c?.status ?? '',
				lastWorkingDay: c?.lastWorkingDay ?? '',
				employeeDisplayName: emp?.displayName ?? '',
				employeeUserId: emp?.userId ?? 0,
				allowAttachments: t.allowAttachments ?? allowAttachmentsFor(t.taskCode)
			};
		});
}

export function navigationForUser(user: PublicUser): NavItem[] {
	return appStore.navigation
		.filter((n) => {
			if (!n.isActive) return false;
			if (n.adminOnly && !user.roles.includes('admin')) return false;
			if (n.reportsOnly && !canAccessReports(user.roles)) return false;
			return true;
		})
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
	const byStatusMap = new Map<string, number>();
	for (const c of open) byStatusMap.set(c.status, (byStatusMap.get(c.status) ?? 0) + 1);
	return {
		openCases: open.length,
		lwdToday: open.filter((c) => c.lastWorkingDay === today).length,
		lwdAtRisk: open.filter((c) => c.lastWorkingDay <= today).length,
		overduePhase1Tasks: listTasks().filter(
			(t) =>
				t.phase === 'pre_last_day' &&
				['pending', 'in_progress'].includes(t.status) &&
				t.dueAt &&
				t.dueAt.slice(0, 10) < today
		).length,
		clearedLast7Days: 0,
		byStatus: [...byStatusMap.entries()].map(([status, count]) => ({ status, count })),
		pendingQueue: queueForUser(user).length
	};
}

export function startTask(actor: PublicUser, taskId: number) {
	const task = getTask(taskId);
	if (!task) throw new Error('Task not found');
	if (task.status !== 'pending') throw new Error('Task is not pending');
	const before = task.status;
	task.status = 'in_progress';
	pushAudit(task.exitCaseId, 'task_start', {
		statusBefore: before,
		statusAfter: task.status,
		taskTitle: task.title,
		actorDisplayName: actor.displayName
	});
}

export function completeTask(actor: PublicUser, taskId: number, notes: string | null) {
	const task = getTask(taskId);
	if (!task) throw new Error('Task not found');
	if (!['pending', 'in_progress'].includes(task.status)) {
		throw new Error('Task cannot be completed');
	}
	const before = task.status;
	task.status = 'completed';
	task.notes = notes;
	refreshCaseSummary(task.exitCaseId);
	pushAudit(task.exitCaseId, 'task_complete', {
		statusBefore: before,
		statusAfter: task.status,
		taskTitle: task.title,
		actorDisplayName: actor.displayName
	});
}

export function skipTask(actor: PublicUser, taskId: number, notes: string | null) {
	const task = getTask(taskId);
	if (!task) throw new Error('Task not found');
	if (task.isRequired) throw new Error('Required tasks cannot be skipped');
	if (!['pending', 'in_progress'].includes(task.status)) {
		throw new Error('Task cannot be skipped');
	}
	const before = task.status;
	task.status = 'skipped';
	task.notes = notes;
	refreshCaseSummary(task.exitCaseId);
	pushAudit(task.exitCaseId, 'task_skip', {
		statusBefore: before,
		statusAfter: task.status,
		taskTitle: task.title,
		actorDisplayName: actor.displayName
	});
}

export function rollbackTask(
	actor: PublicUser,
	taskId: number,
	notes: string,
	targetStatus: 'pending' | 'in_progress'
) {
	if (!canAccessAdmin(actor.roles)) throw new Error('Forbidden');
	const task = getTask(taskId);
	if (!task) throw new Error('Task not found');
	if (!['completed', 'skipped'].includes(task.status)) {
		throw new Error('Only completed/skipped tasks can be reopened');
	}
	const before = task.status;
	task.status = targetStatus;
	task.notes = notes;
	refreshCaseSummary(task.exitCaseId);
	pushAudit(task.exitCaseId, 'task_rollback', {
		statusBefore: before,
		statusAfter: task.status,
		taskTitle: task.title,
		actorDisplayName: actor.displayName
	});
}

export function listTaskAttachments(taskId: number): TaskAttachment[] {
	return appStore.attachments.filter((a) => a.taskId === taskId);
}

export function addTaskAttachment(
	actor: PublicUser,
	taskId: number,
	file: { name: string; type: string; size: number }
) {
	const task = getTask(taskId);
	if (!task) throw new Error('Task not found');
	if (!(task.allowAttachments ?? allowAttachmentsFor(task.taskCode))) {
		throw new Error('Attachments are not enabled for this task.');
	}
	const row: TaskAttachment = {
		attachmentId: nextAttachmentId++,
		taskId,
		exitCaseId: task.exitCaseId,
		originalFileName: file.name,
		contentType: file.type || 'application/octet-stream',
		fileSizeBytes: file.size,
		createdAt: new Date().toISOString(),
		uploadedByDisplayName: actor.displayName,
		uploadedByUsername: actor.username
	};
	appStore.attachments.push(row);
	task.attachmentCount = (task.attachmentCount ?? 0) + 1;
	return row.attachmentId;
}

export function listNotifications(userId: number, unreadOnly = false, top = 100) {
	return appStore.notifications
		.filter((n) => n.userId === userId && (!unreadOnly || !n.isRead))
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.slice(0, top);
}

export function markNotificationRead(userId: number, notificationId: number) {
	const n = appStore.notifications.find(
		(x) => x.notificationId === notificationId && x.userId === userId
	);
	if (n) n.isRead = true;
}

export function markAllNotificationsRead(userId: number) {
	for (const n of appStore.notifications) {
		if (n.userId === userId) n.isRead = true;
	}
}

export function loadReportSummary(user: PublicUser): ReportSummary | null {
	if (!canAccessReports(user.roles)) return null;
	const s = dashboardSummary(user);
	return {
		openCases: s.openCases,
		lwdToday: s.lwdToday,
		lwdAtRisk: s.lwdAtRisk,
		overduePhase1Tasks: s.overduePhase1Tasks,
		clearedLast7Days: s.clearedLast7Days,
		byStatus: s.byStatus
	};
}

export function loadReportPipeline(
	user: PublicUser,
	filters: {
		dateFrom?: string | null;
		dateTo?: string | null;
		department?: string | null;
		status?: string | null;
	}
): PipelineRow[] | null {
	if (!canAccessReports(user.roles)) return null;
	return listCases()
		.filter((c) => {
			if (filters.status && c.status !== filters.status) return false;
			if (filters.department && (c.department || '') !== filters.department) return false;
			if (filters.dateFrom && c.lastWorkingDay < filters.dateFrom) return false;
			if (filters.dateTo && c.lastWorkingDay > filters.dateTo) return false;
			return true;
		})
		.map((c) => {
			const emp = findUserById(c.employeeUserId);
			return {
				exitCaseId: c.exitCaseId,
				caseNumber: c.caseNumber,
				status: c.status,
				department: c.department,
				lastWorkingDay: c.lastWorkingDay,
				employeeDisplayName: emp?.displayName ?? 'Unknown',
				employeeUsername: emp?.username ?? ''
			};
		});
}

export function loadReportTaskAging(
	user: PublicUser,
	filters: { ownerRole?: string | null; phase?: string | null }
): TaskAgingRow[] | null {
	if (!canAccessReports(user.roles)) return null;
	const today = Date.now();
	return listTasks()
		.filter((t) => ['pending', 'in_progress'].includes(t.status))
		.filter((t) => !filters.ownerRole || t.ownerRole === filters.ownerRole)
		.filter((t) => !filters.phase || t.phase === filters.phase)
		.map((t) => {
			const c = getCase(t.exitCaseId);
			const emp = findUserById(c?.employeeUserId ?? 0);
			const due = t.dueAt ? new Date(t.dueAt).getTime() : today;
			return {
				taskId: t.taskId,
				exitCaseId: t.exitCaseId,
				caseNumber: c?.caseNumber ?? '',
				title: t.title,
				ownerRole: t.ownerRole,
				taskStatus: t.status,
				ageDays: Math.max(0, Math.floor((today - due) / 86400000)),
				employeeDisplayName: emp?.displayName ?? 'Unknown'
			};
		});
}

export function loadReportSla(user: PublicUser, yearMonth: string): SlaRow[] | null {
	if (!canAccessReports(user.roles)) return null;
	return listCases()
		.filter((c) => c.lastWorkingDay.startsWith(yearMonth))
		.map((c) => {
			const emp = findUserById(c.employeeUserId);
			const met = c.status === 'fully_cleared';
			return {
				exitCaseId: c.exitCaseId,
				caseNumber: c.caseNumber,
				lastWorkingDay: c.lastWorkingDay,
				employeeDisplayName: emp?.displayName ?? 'Unknown',
				metSla: met,
				slaOutcome: met ? 'Met' : 'Open / at risk'
			};
		});
}

export function loadReportAudit(
	user: PublicUser,
	filters: {
		caseNumber?: string | null;
		dateFrom?: string | null;
		dateTo?: string | null;
	}
): AuditRow[] | null {
	if (!canAccessReports(user.roles)) return null;
	return appStore.audit.filter((a) => {
		if (filters.caseNumber && a.caseNumber !== filters.caseNumber) return false;
		const d = a.createdAt.slice(0, 10);
		if (filters.dateFrom && d < filters.dateFrom) return false;
		if (filters.dateTo && d > filters.dateTo) return false;
		return true;
	});
}

export function listInterviewers(includeInactive = false): InterviewerMapRow[] {
	return appStore.interviewers.filter((i) => includeInactive || i.isActive);
}

export function createInterviewer(positionPattern: string, interviewerUserId: number) {
	const u = findUserById(interviewerUserId);
	if (!u) throw new Error('Interviewer user not found');
	const row: InterviewerMapRow = {
		mapId: nextMapId++,
		positionPattern,
		interviewerUserId,
		interviewerUsername: u.username,
		interviewerDisplayName: u.displayName,
		interviewerEmail: u.email,
		isActive: true,
		createdAt: new Date().toISOString()
	};
	appStore.interviewers.unshift(row);
	return row.mapId;
}

export function updateInterviewer(
	mapId: number,
	positionPattern: string,
	interviewerUserId: number,
	isActive: boolean
) {
	const idx = appStore.interviewers.findIndex((i) => i.mapId === mapId);
	if (idx < 0) throw new Error('Mapping not found');
	const u = findUserById(interviewerUserId);
	if (!u) throw new Error('Interviewer user not found');
	appStore.interviewers[idx] = {
		...appStore.interviewers[idx],
		positionPattern,
		interviewerUserId,
		interviewerUsername: u.username,
		interviewerDisplayName: u.displayName,
		interviewerEmail: u.email,
		isActive
	};
}

export function deactivateInterviewer(mapId: number) {
	const row = appStore.interviewers.find((i) => i.mapId === mapId);
	if (!row) throw new Error('Mapping not found');
	row.isActive = false;
}

export function listTaskTemplates(): TaskTemplateAdmin[] {
	return [...appStore.taskTemplates].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function setTemplateAttachments(taskTemplateId: number, allowAttachments: boolean) {
	const t = appStore.taskTemplates.find((x) => x.taskTemplateId === taskTemplateId);
	if (!t) throw new Error('Template not found');
	t.allowAttachments = allowAttachments;
	for (const task of casesStore.tasks) {
		if (task.taskCode === t.taskCode) task.allowAttachments = allowAttachments;
	}
}

