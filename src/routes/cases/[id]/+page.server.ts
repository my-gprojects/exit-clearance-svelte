import { error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { canManageCases } from '$lib/roles';
import { findUserById, getCase, tasksForCase } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	const user = requireUser(cookies);
	const exitCaseId = Number(params.id);
	if (!Number.isFinite(exitCaseId)) throw error(400, 'Invalid case id');

	const exitCase = getCase(exitCaseId);
	if (!exitCase) throw error(404, 'Case not found');

	const manage = canManageCases(user.roles);
	if (!manage && exitCase.employeeUserId !== user.userId) {
		throw error(403, 'Forbidden');
	}

	const employee = findUserById(exitCase.employeeUserId);
	const tasks = tasksForCase(exitCaseId);

	return {
		user,
		exitCase: {
			...exitCase,
			employeeDisplayName: employee?.displayName ?? 'Unknown',
			employeeEmail: employee?.email ?? ''
		},
		tasks,
		canManage: manage
	};
};
