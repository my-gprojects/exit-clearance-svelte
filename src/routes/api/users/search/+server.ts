import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { canAccessAdmin } from '$lib/roles';
import { searchUsers } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const user = requireUser(cookies);
	if (!canAccessAdmin(user.roles)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}
	const q = url.searchParams.get('q') ?? '';
	return json({ users: searchUsers(q) });
};
