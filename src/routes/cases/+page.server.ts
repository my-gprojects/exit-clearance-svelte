import { error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { canManageCases } from '$lib/roles';
import { casesForUser, findUserById } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireUser(cookies);
	if (!canManageCases(user.roles) && !user.roles.includes('employee')) {
		throw error(403, 'Forbidden');
	}

	const cases = casesForUser(user).map((c) => ({
		...c,
		employeeDisplayName: findUserById(c.employeeUserId)?.displayName ?? 'Unknown'
	}));

	return { user, cases, canManage: canManageCases(user.roles) };
};
