import { isUser, jsonError, jsonOk, requireApiUser } from '$lib/server/http';
import { setTemplateAttachments } from '$lib/server/db';
import { canAccessAdmin } from '$lib/roles';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ cookies, params, request }) => {
	const userOrRes = await requireApiUser(cookies);
	if (!isUser(userOrRes)) return userOrRes;
	if (!canAccessAdmin(userOrRes.roles)) return jsonError('Forbidden', 403);
	const taskTemplateId = Number(params.id);
	if (!Number.isInteger(taskTemplateId) || taskTemplateId <= 0) {
		return jsonError('Invalid template id.', 400);
	}
	try {
		const body = (await request.json()) as { allowAttachments?: unknown };
		if (typeof body.allowAttachments !== 'boolean') {
			return jsonError('allowAttachments must be a boolean.', 400);
		}
		setTemplateAttachments(taskTemplateId, body.allowAttachments);
		return jsonOk({ ok: true });
	} catch (err) {
		return jsonError(err instanceof Error ? err.message : 'Failed to update template', 400);
	}
};
