export type RoleCode =
	| 'employee'
	| 'performance_manager'
	| 'ppc_hrbp'
	| 'ppc_ld'
	| 'ppc_people_services'
	| 'it'
	| 'ops'
	| 'finance'
	| 'risk_management'
	| 'admin';

export type PublicUser = {
	userId: number;
	username: string;
	displayName: string;
	email: string;
	department: string | null;
	employeeCode: string | null;
	roles: RoleCode[];
};

export type StoredUser = PublicUser & {
	password: string;
	isActive: boolean;
};

export type TaskSummary = {
	total: number;
	completed: number;
	skipped: number;
};

export type ExitCase = {
	exitCaseId: number;
	caseNumber: string;
	status: string;
	employeeUserId: number;
	performanceManagerUserId: number | null;
	positionTitle: string;
	department: string;
	lastWorkingDay: string;
	resignationDate: string;
	openedAt: string;
	tasksSummary: {
		overall: TaskSummary;
		preLastDay: TaskSummary;
		lastWorkingDay: TaskSummary;
	};
};

export type ExitTask = {
	taskId: number;
	exitCaseId: number;
	taskCode: string;
	phase: string;
	title: string;
	ownerRole: string;
	assignedUserId: number | null;
	isRequired: boolean;
	status: string;
	sortOrder: number;
	dueAt: string | null;
};

export type NavItem = {
	id: number;
	name: string;
	url: string;
	iconClass: string;
	sortNumber: number;
	parentId: number | null;
	isActive: boolean;
	adminOnly?: boolean;
};

export type Note = {
	noteId: number;
	userId: number;
	title: string;
	body: string;
	createdAt: string;
};

export type SessionData = {
	userId: number;
	username: string;
};
