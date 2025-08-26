// ABOUTME: SvelteKit API route for handling Dexie Cloud authentication token requests
// ABOUTME: Forwards client credentials to Dexie Cloud API and returns authentication tokens
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { PUBLIC_DEXIE_CLOUD_DB_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

// Types based on dexie-cloud-common but defined here since module exports aren't set up for direct import
interface TokenRequestBody {
	public_key: string;
}

interface ClientCredentialsTokenRequest {
	grant_type: 'client_credentials';
	client_id: string;
	client_secret: string;
	public_key?: string;
	scopes: string[];
	claims?: {
		sub: string;
		email?: string;
		email_verified?: string;
		[customClaim: string]: unknown;
	};
	expires_in?: string;
	not_before?: string;
}

interface TokenFinalResponse {
	type: 'tokens';
	claims: {
		sub: string;
		license?: 'ok' | 'expired' | 'deactivated';
		[claimName: string]: unknown;
	};
	accessToken: string;
	accessTokenExpiration: number;
	refreshToken?: string;
	refreshTokenExpiration?: number | null;
	userType: 'demo' | 'eval' | 'prod' | 'client';
	evalDaysLeft?: number;
	userValidUntil?: number;
	alerts?: {
		type: 'warning' | 'info';
		messageCode: string;
		message: string;
		messageParams?: {
			[param: string]: string;
		};
	}[];
	data?: unknown;
}

interface TokenErrorResponse {
	type: 'error';
	title: string;
	messageCode: 'INVALID_OTP' | 'INVALID_EMAIL' | 'LICENSE_LIMIT_REACHED' | 'GENERIC_ERROR';
	message: string;
	messageParams?: {
		[param: string]: string;
	};
}

type TokenResponse = TokenFinalResponse | TokenErrorResponse;

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Validate environment variables
		if (
			!PUBLIC_DEXIE_CLOUD_DB_URL ||
			!env.DEXIE_CLOUD_CLIENT_ID ||
			!env.DEXIE_CLOUD_CLIENT_SECRET
		) {
			throw error(500, 'Missing required Dexie Cloud configuration');
		}

		// Parse request body
		const body: TokenRequestBody = await request.json();

		if (!body.public_key) {
			throw error(400, 'Missing required public_key parameter');
		}

		// Get authenticated user from Supabase session (set by hooks.server.ts)
		const user = locals.user;

		// If no authenticated user, return unauthorized
		if (!user?.id) {
			throw error(401, 'Authentication required');
		}

		// Prepare token request for Dexie Cloud
		const tokenRequestBody: ClientCredentialsTokenRequest = {
			grant_type: 'client_credentials',
			scopes: ['ACCESS_DB'],
			public_key: body.public_key,
			client_id: env.DEXIE_CLOUD_CLIENT_ID,
			client_secret: env.DEXIE_CLOUD_CLIENT_SECRET,
			claims: {
				sub: user.id,
				email: user.email
			}
		};

		// Request token from Dexie Cloud
		const tokenResponse = await fetch(`${PUBLIC_DEXIE_CLOUD_DB_URL}/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify(tokenRequestBody)
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error('Dexie Cloud token request failed:', errorText);
			throw error(500, 'Failed to retrieve token from Dexie Cloud');
		}

		const tokenData: TokenResponse = await tokenResponse.json();

		// Return token response with security headers
		return json(tokenData, {
			headers: {
				'Cache-Control': 'no-store'
			}
		});
	} catch (err) {
		// Handle SvelteKit errors (thrown by error() function)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Handle other errors
		console.error('Dexie Cloud token endpoint error:', err);
		throw error(500, 'Internal server error');
	}
};
