import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { canAccessAdmin, ALL_ROLE_CODES } from '$lib/roles';
import { setUserRoles } from '$lib/server/db';
import type { RoleCode } from '$lib/types';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ cookies, params, request }) => {
	const actor = requireUser(cookies);
	if (!canAccessAdmin(actor.roles)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const userId = Number(params.id);
	if (!Number.isFinite(userId)) return json({ error: 'Invalid id' }, { status: 400 });

	const body = (await request.json()) as { roles?: string[] };
	const roles = (body.roles ?? []).filter((r): r is RoleCode =>
		(ALL_ROLE_CODES as string[]).includes(r)
	);

	const updated = setUserRoles(userId, roles);
	if (!updated) return json({ error: 'Not found' }, { status: 404 });
	return json({ user: updated });
};
