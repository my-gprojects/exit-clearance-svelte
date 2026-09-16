import { redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import {
	loadReportAudit,
	loadReportPipeline,
	loadReportSla,
	loadReportSummary,
	loadReportTaskAging
} from '$lib/server/db';
import { ALL_ROLE_CODES, canAccessReports } from '$lib/roles';
import type { PageServerLoad } from './$types';

type Tab = 'pipeline' | 'task-aging' | 'sla' | 'audit';

function currentYearMonth() {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Jakarta',
		year: 'numeric',
		month: '2-digit'
	})
		.format(new Date())
		.slice(0, 7);
}

function dateOrNull(raw: string | null): string | null {
	if (!raw) return null;
	return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = requireUser(cookies);
	if (!canAccessReports(user.roles)) throw redirect(303, '/dashboard');

	const tab = (url.searchParams.get('tab') as Tab) || 'pipeline';
	const dateFrom = dateOrNull(url.searchParams.get('dateFrom'));
	const dateTo = dateOrNull(url.searchParams.get('dateTo'));
	const department = url.searchParams.get('department')?.trim() || '';
	const status = url.searchParams.get('status')?.trim() || '';
	const ownerRole = url.searchParams.get('ownerRole')?.trim() || '';
	const phase = url.searchParams.get('phase')?.trim() || '';
	const yearMonth = url.searchParams.get('yearMonth')?.trim() || currentYearMonth();
	const caseNumber = url.searchParams.get('caseNumber')?.trim() || '';

	const summary = loadReportSummary(user);
	let pipeline: NonNullable<ReturnType<typeof loadReportPipeline>> = [];
	let aging: NonNullable<ReturnType<typeof loadReportTaskAging>> = [];
	let sla: NonNullable<ReturnType<typeof loadReportSla>> = [];
	let audit: NonNullable<ReturnType<typeof loadReportAudit>> = [];

	if (tab === 'pipeline') {
		pipeline = loadReportPipeline(user, { dateFrom, dateTo, department, status }) ?? [];
	} else if (tab === 'task-aging') {
		aging = loadReportTaskAging(user, { ownerRole, phase }) ?? [];
	} else if (tab === 'sla') {
		sla = loadReportSla(user, yearMonth) ?? [];
	} else {
		audit = loadReportAudit(user, { caseNumber, dateFrom, dateTo }) ?? [];
	}

	return {
		user,
		summary,
		tab,
		filters: {
			dateFrom: dateFrom ?? '',
			dateTo: dateTo ?? '',
			department,
			status,
			ownerRole,
			phase,
			yearMonth,
			caseNumber
		},
		pipeline,
		aging,
		sla,
		audit,
		roleCodes: ALL_ROLE_CODES
	};
};
