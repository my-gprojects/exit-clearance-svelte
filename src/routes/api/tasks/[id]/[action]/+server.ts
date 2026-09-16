import {
	addTaskAttachment,
	completeTask,
	listTaskAttachments,
	rollbackTask,
	skipTask,
	startTask
} from '$lib/server/db';
import { isUser, jsonError, jsonOk, requireApiUser } from '$lib/server/http';
import type { RequestHandler } from './$types';

function parseTaskId(raw: string): number | null {
	const id = Number(raw);
	if (!Number.isInteger(id) || id <= 0) return null;
	return id;
}

export const POST: RequestHandler = async ({ cookies, params, request, url }) => {
	const userOrRes = await requireApiUser(cookies);
	if (!isUser(userOrRes)) return userOrRes;
	const user = userOrRes;
	const taskId = parseTaskId(params.id);
	if (!taskId) return jsonError('Invalid task id.', 400);

	const action = url.pathname.split('/').pop();

	try {
		if (action === 'start') {
			startTask(user, taskId);
			return jsonOk({ ok: true });
		}
		if (action === 'complete') {
			const body = (await request.json().catch(() => ({}))) as { notes?: unknown };
			const notes =
				typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : null;
			completeTask(user, taskId, notes || null);
			return jsonOk({ ok: true });
		}
		if (action === 'skip') {
			const body = (await request.json().catch(() => ({}))) as { notes?: unknown };
			const notes =
				typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : null;
			skipTask(user, taskId, notes || null);
			return jsonOk({ ok: true });
		}
		if (action === 'rollback') {
			const body = (await request.json().catch(() => ({}))) as {
				notes?: unknown;
				targetStatus?: unknown;
			};
			const notes =
				typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : '';
			if (!notes) return jsonError('Rollback reason is required.', 400);
			const targetStatus =
				body.targetStatus === 'in_progress' ? 'in_progress' : 'pending';
			rollbackTask(user, taskId, notes, targetStatus);
			return jsonOk({ ok: true });
		}
		if (action === 'attachments') {
			const form = await request.formData();
			const file = form.get('file');
			if (!(file instanceof File)) return jsonError('file is required.', 400);
			const attachmentId = addTaskAttachment(user, taskId, {
				name: file.name || 'file',
				type: file.type || 'application/octet-stream',
				size: file.size
			});
			return jsonOk({ attachmentId }, { status: 201 });
		}
		return jsonError('Unknown action', 404);
	} catch (err) {
		const msg = err instanceof Error ? err.message : null;
		return jsonError(msg || 'Action failed', 400);
	}
};

export const GET: RequestHandler = async ({ cookies, params, url }) => {
	const userOrRes = await requireApiUser(cookies);
	if (!isUser(userOrRes)) return userOrRes;
	const taskId = parseTaskId(params.id);
	if (!taskId) return jsonError('Invalid task id.', 400);
	if (!url.pathname.endsWith('/attachments')) return jsonError('Not found', 404);
	return jsonOk({ attachments: listTaskAttachments(taskId) });
};
