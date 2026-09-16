import { isUser, jsonError, jsonOk, requireApiUser } from '$lib/server/http';
import { createInterviewer, listInterviewers } from '$lib/server/db';
import { canAccessAdmin } from '$lib/roles';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const userOrRes = await requireApiUser(cookies);
	if (!isUser(userOrRes)) return userOrRes;
	if (!canAccessAdmin(userOrRes.roles)) return jsonError('Forbidden', 403);
	const includeInactive = url.searchParams.get('includeInactive') === '1';
	return jsonOk({ mappings: listInterviewers(includeInactive) });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const userOrRes = await requireApiUser(cookies);
	if (!isUser(userOrRes)) return userOrRes;
	if (!canAccessAdmin(userOrRes.roles)) return jsonError('Forbidden', 403);
	try {
		const body = (await request.json()) as {
			positionPattern?: unknown;
			interviewerUserId?: unknown;
		};
		const positionPattern =
			typeof body.positionPattern === 'string' ? body.positionPattern.trim() : '';
		if (!positionPattern) return jsonError('Position pattern is required.', 400);
		const interviewerUserId = Number(body.interviewerUserId);
		if (!Number.isInteger(interviewerUserId) || interviewerUserId <= 0) {
			return jsonError('Interviewer user is required.', 400);
		}
		const mapId = createInterviewer(positionPattern, interviewerUserId);
		return jsonOk({ mapId }, { status: 201 });
	} catch (err) {
		return jsonError(err instanceof Error ? err.message : 'Failed to create mapping', 400);
	}
};
