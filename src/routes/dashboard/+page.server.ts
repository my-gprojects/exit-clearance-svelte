import { requireUser } from '$lib/server/auth';
import {
	casesForUser,
	dashboardSummary,
	findUserById,
	queueForUser
} from '$lib/server/db';
import { canManageCases } from '$lib/roles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireUser(cookies);
	const cases = casesForUser(user).map((c) => ({
		...c,
		employeeDisplayName: findUserById(c.employeeUserId)?.displayName ?? 'Unknown',
		employee: {
			userId: c.employeeUserId,
			displayName: findUserById(c.employeeUserId)?.displayName ?? 'Unknown'
		}
	}));
	const queue = queueForUser(user);
	const summary = dashboardSummary(user);
	const myCase =
		cases.find(
			(c) =>
				c.employeeUserId === user.userId &&
				!['cancelled', 'fully_cleared'].includes(c.status)
		) ?? null;

	return {
		user,
		cases,
		queue,
		summary,
		myCase,
		manage: canManageCases(user.roles)
	};
};
