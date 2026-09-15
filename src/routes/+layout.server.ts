import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { navigationForUser } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const isLogin = url.pathname === '/login';
	if (!locals.user && !isLogin && !url.pathname.startsWith('/api/')) {
		throw redirect(303, '/login');
	}
	if (locals.user && isLogin) {
		throw redirect(303, '/dashboard');
	}

	return {
		user: locals.user,
		navigation: locals.user ? navigationForUser(locals.user) : []
	};
};
