import { isUser, jsonError, jsonOk, requireApiUser } from '$lib/server/http';
import { deactivateInterviewer, updateInterviewer } from '$lib/server/db';
import { canAccessAdmin } from '$lib/roles';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ cookies, params, request }) => {
	const userOrRes = await requireApiUser(cookies);
	if (!isUser(userOrRes)) return userOrRes;
	if (!canAccessAdmin(userOrRes.roles)) return jsonError('Forbidden', 403);
	const mapId = Number(params.id);
	if (!Number.isInteger(mapId) || mapId <= 0) return jsonError('Invalid mapping id.', 400);
	try {
		const body = (await request.json()) as {
			positionPattern?: unknown;
			interviewerUserId?: unknown;
			isActive?: unknown;
		};
		const positionPattern =
			typeof body.positionPattern === 'string' ? body.positionPattern.trim() : '';
		if (!positionPattern) return jsonError('Position pattern is required.', 400);
		const interviewerUserId = Number(body.interviewerUserId);
		if (!Number.isInteger(interviewerUserId) || interviewerUserId <= 0) {
			return jsonError('Interviewer user is required.', 400);
		}
		const isActive = body.isActive !== false && body.isActive !== 0;
		updateInterviewer(mapId, positionPattern, interviewerUserId, isActive);
		return jsonOk({ ok: true });
	} catch (err) {
		return jsonError(err instanceof Error ? err.message : 'Failed to update mapping', 400);
	}
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	const userOrRes = await requireApiUser(cookies);
	if (!isUser(userOrRes)) return userOrRes;
	if (!canAccessAdmin(userOrRes.roles)) return jsonError('Forbidden', 403);
	const mapId = Number(params.id);
	if (!Number.isInteger(mapId) || mapId <= 0) return jsonError('Invalid mapping id.', 400);
	try {
		deactivateInterviewer(mapId);
		return jsonOk({ ok: true });
	} catch (err) {
		return jsonError(err instanceof Error ? err.message : 'Failed to deactivate mapping', 400);
	}
};
