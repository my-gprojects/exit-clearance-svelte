import { error, fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { canAccessAdmin, ALL_ROLE_CODES } from '$lib/roles';
import { listUsers, setUserRoles } from '$lib/server/db';
import type { RoleCode } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireUser(cookies);
	if (!canAccessAdmin(user.roles)) throw error(403, 'Admin only');

	return {
		user,
		users: listUsers().map((u) => ({
			userId: u.userId,
			username: u.username,
			displayName: u.displayName,
			email: u.email,
			department: u.department,
			employeeCode: u.employeeCode,
			roles: u.roles,
			isActive: u.isActive
		})),
		roleCodes: ALL_ROLE_CODES
	};
};

export const actions: Actions = {
	saveRoles: async ({ request, cookies }) => {
		const actor = requireUser(cookies);
		if (!canAccessAdmin(actor.roles)) throw error(403, 'Admin only');

		const form = await request.formData();
		const userId = Number(form.get('userId'));
		if (!Number.isFinite(userId)) return fail(400, { error: 'Invalid user' });

		const roles = form
			.getAll('roles')
			.map(String)
			.filter((r): r is RoleCode => (ALL_ROLE_CODES as string[]).includes(r));

		const updated = setUserRoles(userId, roles);
		if (!updated) return fail(404, { error: 'User not found' });

		return { ok: true, userId, roles: updated.roles };
	}
};
