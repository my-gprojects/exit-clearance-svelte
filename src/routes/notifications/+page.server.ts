import { requireUser } from '$lib/server/auth';
import {
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead
} from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = requireUser(cookies);
	const unreadOnly = url.searchParams.get('unreadOnly') === '1';
	return {
		user,
		notifications: listNotifications(user.userId, unreadOnly, 100),
		unreadOnly
	};
};

export const actions: Actions = {
	markRead: async ({ request, cookies }) => {
		const user = requireUser(cookies);
		const form = await request.formData();
		const id = Number(form.get('notificationId'));
		if (!Number.isInteger(id) || id <= 0) return { ok: false };
		markNotificationRead(user.userId, id);
		return { ok: true };
	},
	markAllRead: async ({ cookies }) => {
		const user = requireUser(cookies);
		markAllNotificationsRead(user.userId);
		return { ok: true };
	}
};
