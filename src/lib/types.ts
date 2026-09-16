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
	notes?: string | null;
	allowAttachments?: boolean;
	attachmentCount?: number;
};

export type QueueTask = ExitTask & {
	caseNumber: string;
	caseStatus: string;
	lastWorkingDay: string;
	employeeDisplayName: string;
	employeeUserId: number;
	allowAttachments: boolean;
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
	reportsOnly?: boolean;
};

export type Note = {
	noteId: number;
	userId: number;
	title: string;
	body: string;
	createdAt: string;
};

export type AppNotification = {
	notificationId: number;
	userId: number;
	exitCaseId: number | null;
	taskId: number | null;
	eventType: string;
	title: string;
	body: string | null;
	isRead: boolean;
	createdAt: string;
	caseNumber: string | null;
};

export type InterviewerMapRow = {
	mapId: number;
	positionPattern: string;
	interviewerUserId: number;
	interviewerUsername: string;
	interviewerDisplayName: string;
	interviewerEmail: string;
	isActive: boolean;
	createdAt: string;
};

export type TaskTemplateAdmin = {
	taskTemplateId: number;
	taskCode: string;
	phase: string;
	title: string;
	ownerRole: string;
	isRequired: boolean;
	sortOrder: number;
	isActive: boolean;
	allowAttachments: boolean;
};

export type TaskAttachment = {
	attachmentId: number;
	taskId: number;
	exitCaseId: number;
	originalFileName: string;
	contentType: string;
	fileSizeBytes: number;
	createdAt: string;
	uploadedByDisplayName: string;
	uploadedByUsername: string;
};

export type ReportSummary = {
	openCases: number;
	lwdToday: number;
	lwdAtRisk: number;
	overduePhase1Tasks: number;
	clearedLast7Days: number;
	byStatus: { status: string; count: number }[];
};

export type PipelineRow = {
	exitCaseId: number;
	caseNumber: string;
	status: string;
	department: string | null;
	lastWorkingDay: string;
	employeeDisplayName: string;
	employeeUsername: string;
};

export type TaskAgingRow = {
	taskId: number;
	exitCaseId: number;
	caseNumber: string;
	title: string;
	ownerRole: string;
	taskStatus: string;
	ageDays: number;
	employeeDisplayName: string;
};

export type SlaRow = {
	exitCaseId: number;
	caseNumber: string;
	lastWorkingDay: string;
	employeeDisplayName: string;
	metSla: boolean;
	slaOutcome: string;
};

export type AuditRow = {
	auditId: number;
	exitCaseId: number;
	caseNumber: string;
	action: string;
	statusBefore: string | null;
	statusAfter: string | null;
	taskTitle: string | null;
	createdAt: string;
	actorDisplayName: string | null;
};

export type UserSearchHit = {
	userId: number;
	username: string;
	displayName: string;
	email: string;
	department: string | null;
};

export type TaskActionMode = 'complete' | 'skip' | 'start' | 'rollback';

export type SessionData = {
	userId: number;
	username: string;
};
