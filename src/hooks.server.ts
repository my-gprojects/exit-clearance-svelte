import { getCurrentUser } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = getCurrentUser(event.cookies);
	return resolve(event);
};
