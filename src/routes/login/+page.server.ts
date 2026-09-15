import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, loginWithPassword } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '');
		const password = String(form.get('password') ?? '');
		const user = loginWithPassword(username, password);
		if (!user) {
			return fail(401, { error: 'Invalid username or password', username });
		}
		createSession(cookies, user);
		throw redirect(303, '/dashboard');
	}
};
