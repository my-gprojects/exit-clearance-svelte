import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { findUserById, findUserByUsername, toPublicUser } from '$lib/server/db';
import type { PublicUser, SessionData } from '$lib/types';

const COOKIE = 'ec_svelte_session';
const TTL_SEC = 60 * 60 * 8;

function encodeSession(data: SessionData): string {
	return Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
}

function decodeSession(raw: string | undefined): SessionData | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as SessionData;
		if (!parsed?.userId || !parsed?.username) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function createSession(cookies: Cookies, user: PublicUser) {
	const payload: SessionData = { userId: user.userId, username: user.username };
	cookies.set(COOKIE, encodeSession(payload), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: TTL_SEC
	});
	cookies.set('ec_auth_hint', '1', {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: false,
		maxAge: TTL_SEC
	});
}

export function destroySession(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/' });
	cookies.delete('ec_auth_hint', { path: '/' });
}

export function readSession(cookies: Cookies): SessionData | null {
	return decodeSession(cookies.get(COOKIE));
}

export function getCurrentUser(cookies: Cookies): PublicUser | null {
	const session = readSession(cookies);
	if (!session) return null;
	const user = findUserById(session.userId);
	if (!user?.isActive) return null;
	return toPublicUser(user);
}

export function requireUser(cookies: Cookies): PublicUser {
	const user = getCurrentUser(cookies);
	if (!user) throw redirect(303, '/login');
	return user;
}

export function loginWithPassword(username: string, password: string): PublicUser | null {
	const user = findUserByUsername(username);
	if (!user?.isActive) return null;
	if (user.password !== password) return null;
	return toPublicUser(user);
}
