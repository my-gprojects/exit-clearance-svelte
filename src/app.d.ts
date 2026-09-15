/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			user: import('$lib/types').PublicUser | null;
		}
	}
}

export {};
