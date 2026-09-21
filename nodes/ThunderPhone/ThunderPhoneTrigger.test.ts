import { describe, expect, it, vi } from 'vitest';

import { ThunderPhoneTrigger } from './ThunderPhoneTrigger.node';

describe('ThunderPhone trigger lifecycle', () => {
	it('does not list the deferred Call Data Extracted trigger', () => {
		const trigger = new ThunderPhoneTrigger();
		const eventProperty = trigger.description.properties.find((property) => property.name === 'event');
		expect(eventProperty?.options).not.toEqual(
			expect.arrayContaining([expect.objectContaining({ value: 'callDataExtracted' })]),
		);
	});

	it('creates an endpoint with the production webhook URL and stores its secret', async () => {
		const staticData: Record<string, unknown> = {};
		const httpRequestWithAuthentication = vi.fn().mockResolvedValue({
			id: 'endpoint-1',
			secret: 'a'.repeat(48),
		});
		const context = {
			getWorkflowStaticData: vi.fn().mockReturnValue(staticData),
			getNodeParameter: vi.fn().mockReturnValue('callCompleted'),
			getNodeWebhookUrl: vi.fn().mockReturnValue('https://n8n.example/webhook/production-id'),
			getWorkflow: vi.fn().mockReturnValue({ name: 'Save completed calls' }),
			getNode: vi.fn().mockReturnValue({ name: 'ThunderPhone Trigger' }),
			helpers: { httpRequestWithAuthentication },
		};

		const trigger = new ThunderPhoneTrigger();
		const created = await trigger.webhookMethods.default.create.call(context as never);

		expect(created).toBe(true);
		expect(staticData).toEqual({ webhookId: 'endpoint-1', webhookSecret: 'a'.repeat(48) });
		expect(httpRequestWithAuthentication.mock.calls[0][1]).toMatchObject({
			method: 'POST',
			url: '/v1/developer/webhook-endpoints',
			body: {
				label: 'n8n: Save completed calls',
				url: 'https://n8n.example/webhook/production-id',
				events: ['telephony.complete', 'web.complete'],
			},
		});
	});

	it('deletes the remote endpoint and clears local signing state', async () => {
		const staticData: Record<string, unknown> = {
			webhookId: 'endpoint-1',
			webhookSecret: 'secret',
		};
		const httpRequestWithAuthentication = vi.fn().mockResolvedValue(undefined);
		const context = {
			getWorkflowStaticData: vi.fn().mockReturnValue(staticData),
			helpers: { httpRequestWithAuthentication },
		};

		const trigger = new ThunderPhoneTrigger();
		const deleted = await trigger.webhookMethods.default.delete.call(context as never);

		expect(deleted).toBe(true);
		expect(staticData).toEqual({});
		expect(httpRequestWithAuthentication.mock.calls[0][1]).toMatchObject({
			method: 'DELETE',
			url: '/v1/developer/webhook-endpoints/endpoint-1',
		});
	});
});
