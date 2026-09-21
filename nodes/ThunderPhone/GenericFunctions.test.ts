import { describe, expect, it, vi } from 'vitest';

import { thunderPhoneApiRequest } from './GenericFunctions';

describe('thunderPhoneApiRequest', () => {
	it('uses the ThunderPhone credential and production API base URL', async () => {
		const httpRequestWithAuthentication = vi.fn().mockResolvedValue({ call_id: 42 });
		const context = {
			helpers: { httpRequestWithAuthentication },
		};

		const result = await thunderPhoneApiRequest.call(context as never, 'POST', '/v1/call', {
			from_number: '+15551234567',
			to_number: '+14155550199',
			agent_id: 12,
		});

		expect(result).toEqual({ call_id: 42 });
		expect(httpRequestWithAuthentication).toHaveBeenCalledOnce();
		expect(httpRequestWithAuthentication.mock.calls[0][0]).toBe('thunderPhoneApi');
		expect(httpRequestWithAuthentication.mock.calls[0][1]).toMatchObject({
			method: 'POST',
			baseURL: 'https://api.thunderphone.com',
			url: '/v1/call',
			json: true,
		});
	});

	it('does not attach a request body to GET requests', async () => {
		const httpRequestWithAuthentication = vi.fn().mockResolvedValue([]);
		const context = {
			helpers: { httpRequestWithAuthentication },
		};

		await thunderPhoneApiRequest.call(context as never, 'GET', '/v1/agents');

		expect(httpRequestWithAuthentication.mock.calls[0][1]).not.toHaveProperty('body');
	});
});
