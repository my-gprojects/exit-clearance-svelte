import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { canAccessAdmin, canManageCases } from '$lib/roles';
import { searchUsers } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const user = requireUser(cookies);
	if (!canManageCases(user.roles) && !canAccessAdmin(user.roles)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}
	const q = (url.searchParams.get('q') ?? '').trim();
	if (!q) return json({ users: [] });
	return json({ users: searchUsers(q) });
};
