import { error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { listTaskTemplates, setTemplateAttachments } from '$lib/server/db';
import { canAccessAdmin } from '$lib/roles';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireUser(cookies);
	if (!canAccessAdmin(user.roles)) throw error(403, 'Admin only');
	return { user, templates: listTaskTemplates() };
};

export const actions: Actions = {
	toggle: async ({ request, cookies }) => {
		const actor = requireUser(cookies);
		if (!canAccessAdmin(actor.roles)) throw error(403, 'Admin only');
		const form = await request.formData();
		const taskTemplateId = Number(form.get('taskTemplateId'));
		const allowAttachments = form.get('allowAttachments') === '1';
		if (!Number.isInteger(taskTemplateId) || taskTemplateId <= 0) {
			return { error: 'Invalid template id' };
		}
		try {
			setTemplateAttachments(taskTemplateId, allowAttachments);
			return { ok: true, taskTemplateId, allowAttachments };
		} catch (err) {
			return { error: err instanceof Error ? err.message : 'Update failed' };
		}
	}
};
