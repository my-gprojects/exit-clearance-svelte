import { error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import {
	createInterviewer,
	deactivateInterviewer,
	listInterviewers,
	updateInterviewer
} from '$lib/server/db';
import { canAccessAdmin } from '$lib/roles';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = requireUser(cookies);
	if (!canAccessAdmin(user.roles)) throw error(403, 'Admin only');
	const includeInactive = url.searchParams.get('includeInactive') === '1';
	return { user, mappings: listInterviewers(includeInactive), includeInactive };
};

export const actions: Actions = {
	deactivate: async ({ request, cookies }) => {
		const actor = requireUser(cookies);
		if (!canAccessAdmin(actor.roles)) throw error(403, 'Admin only');
		const form = await request.formData();
		const mapId = Number(form.get('mapId'));
		if (!Number.isInteger(mapId) || mapId <= 0) return { error: 'Invalid id' };
		try {
			deactivateInterviewer(mapId);
			return { ok: true };
		} catch (err) {
			return { error: err instanceof Error ? err.message : 'Deactivate failed' };
		}
	},
	save: async ({ request, cookies }) => {
		const actor = requireUser(cookies);
		if (!canAccessAdmin(actor.roles)) throw error(403, 'Admin only');
		const form = await request.formData();
		const mapIdRaw = form.get('mapId');
		const mapId = mapIdRaw ? Number(mapIdRaw) : null;
		const positionPattern = String(form.get('positionPattern') ?? '').trim();
		const interviewerUserId = Number(form.get('interviewerUserId'));
		const isActive = form.get('isActive') !== '0';
		if (!positionPattern || !Number.isInteger(interviewerUserId) || interviewerUserId <= 0) {
			return { error: 'Pattern and interviewer are required.' };
		}
		try {
			if (mapId == null || !Number.isInteger(mapId)) {
				createInterviewer(positionPattern, interviewerUserId);
			} else {
				updateInterviewer(mapId, positionPattern, interviewerUserId, isActive);
			}
			return { ok: true };
		} catch (err) {
			return { error: err instanceof Error ? err.message : 'Save failed' };
		}
	}
};
