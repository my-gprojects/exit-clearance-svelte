import { json } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { getCurrentUser } from '$lib/server/auth';
import type { PublicUser } from '$lib/types';

export function jsonOk<T>(data: T, init?: ResponseInit) {
	return json({ data, error: null }, init);
}

export function jsonError(message: string, status = 400) {
	return json({ data: null, error: message }, { status });
}

export async function requireApiUser(cookies: Cookies): Promise<PublicUser | Response> {
	const user = getCurrentUser(cookies);
	if (!user) return jsonError('Unauthorized', 401);
	return user;
}

export function isUser(value: PublicUser | Response): value is PublicUser {
	return !(value instanceof Response) && 'userId' in value;
}
