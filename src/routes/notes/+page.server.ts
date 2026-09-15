import { requireUser } from '$lib/server/auth';
import { notesForUser } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireUser(cookies);
	return { user, notes: notesForUser(user.userId) };
};
