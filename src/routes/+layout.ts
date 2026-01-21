// ABOUTME: Client layout initialization for browser and server-side Supabase clients
// ABOUTME: Handles auth dependency tracking, PostHog analytics init, and provides unified client access

import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { LayoutLoad } from './$types';
import { db } from '$lib/db';
import { initPostHog, identifyUser } from '$lib/analytics/posthog';

export const ssr = true;

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	/**
	 * Declare a dependency so the layout can be invalidated, for example, on
	 * session refresh.
	 */
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch
				}
			})
		: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch
				},
				cookies: {
					getAll() {
						return data.cookies;
					}
				}
			});

	/**
	 * It's fine to use `getSession` here, because on the client, `getSession` is
	 * safe, and on the server, it reads `session` from the `LayoutData`, which
	 * safely checked the session using `safeGetSession`.
	 */
	const {
		data: { session }
	} = await supabase.auth.getSession();

	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (isBrowser()) {
		// Initialize PostHog analytics
		initPostHog();

		if (user) {
			await db.cloud.login();
			// Identify user for analytics (user ID only, no email)
			identifyUser(user.id);
		}
	}

	return { session, supabase, user };
};
