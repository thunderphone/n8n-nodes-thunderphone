import { describe, expect, it, vi } from 'vitest';

import { ThunderPhone, outboundIdempotencyKey } from './ThunderPhone.node';

function executionContext(
	parameters: Record<string, unknown>,
	request: ReturnType<typeof vi.fn>,
	items = [{ json: {} }],
	executionId = 'execution-42',
	nodeId = 'node-7',
) {
	return {
		getInputData: vi.fn().mockReturnValue(items),
		getNodeParameter: vi.fn((name: string) => parameters[name]),
		getExecutionId: vi.fn().mockReturnValue(executionId),
		getNode: vi.fn().mockReturnValue({ id: nodeId, name: 'ThunderPhone' }),
		continueOnFail: vi.fn().mockReturnValue(false),
		helpers: { httpRequestWithAuthentication: request },
	};
}

describe('ThunderPhone action requests', () => {
	it('reuses a mapped stable key across automatic and whole-execution retries', async () => {
		const request = vi.fn().mockResolvedValueOnce({ call_id: 91 }).mockResolvedValue({
			call_id: 91,
			idempotent_replay: true,
		});
		const context = executionContext(
			{
				resource: 'outboundCall',
				operation: 'place',
				agentId: 12,
				fromNumber: '+15551234567',
				toNumber: '+14155550199',
				variables: { name: 'Ada' },
				idempotencyKey: 'crm-contact-123:event-qualified',
			},
			request,
		);
		const retriedExecution = executionContext(
			{
				resource: 'outboundCall',
				operation: 'place',
				agentId: 12,
				fromNumber: '+15551234567',
				toNumber: '+14155550199',
				variables: { name: 'Ada' },
				idempotencyKey: 'crm-contact-123:event-qualified',
			},
			request,
			undefined,
			'execution-99',
		);
		const node = new ThunderPhone();

		const first = await node.execute.call(context as never);
		const retry = await node.execute.call(context as never);
		await node.execute.call(retriedExecution as never);

		expect(first[0][0].json.call_id).toBe(91);
		expect(retry[0][0].json).toMatchObject({ call_id: 91, idempotent_replay: true });
		expect(request.mock.calls.map((call) => call[1].body.idempotency_key)).toEqual([
			'n8n:node-7:crm-contact-123:event-qualified',
			'n8n:node-7:crm-contact-123:event-qualified',
			'n8n:node-7:crm-contact-123:event-qualified',
		]);
	});

	it('uses the stable node ID so two call nodes do not collide', () => {
		const firstNode = executionContext({}, vi.fn(), undefined, 'execution-42', 'node-7');
		const secondNode = executionContext({}, vi.fn(), undefined, 'execution-99', 'node-8');
		expect(outboundIdempotencyKey(firstNode as never, 'crm-123', 0)).toBe(
			'n8n:node-7:crm-123',
		);
		expect(outboundIdempotencyKey(secondNode as never, 'crm-123', 0)).toBe(
			'n8n:node-8:crm-123',
		);
	});

	it('rejects a blank mapped idempotency key before making a request', async () => {
		const request = vi.fn();
		const context = executionContext(
			{
				resource: 'outboundCall',
				operation: 'place',
				idempotencyKey: '   ',
			},
			request,
		);

		await expect(new ThunderPhone().execute.call(context as never)).rejects.toThrow(
			'must be mapped to a stable upstream record or event ID',
		);
		expect(request).not.toHaveBeenCalled();
	});

	it('fails when every campaign contact is rejected', async () => {
		const request = vi.fn().mockResolvedValue({
			accepted: 0,
			rejected: 1,
			errors: [{ index: 0, error: 'invalid_phone_number' }],
		});
		const context = executionContext(
			{
				resource: 'campaign',
				operation: 'addContacts',
				campaignId: 'campaign-1',
				contacts: [{ phone_number: 'bad' }],
			},
			request,
		);

		await expect(new ThunderPhone().execute.call(context as never)).rejects.toThrow(
			'rejected every campaign contact',
		);
	});

	it('marks mixed campaign results as partial success and preserves row errors', async () => {
		const errors = [{ index: 1, error: 'invalid_phone_number' }];
		const request = vi.fn().mockResolvedValue({ accepted: 1, rejected: 1, errors });
		const context = executionContext(
			{
				resource: 'campaign',
				operation: 'addContacts',
				campaignId: 'campaign-1',
				contacts: [{ phone_number: '+14155550199' }, { phone_number: 'bad' }],
			},
			request,
		);

		const result = await new ThunderPhone().execute.call(context as never);

		expect(result[0][0].json).toMatchObject({
			accepted: 1,
			rejected: 1,
			partial_success: true,
			errors,
		});
	});
});

describe('ThunderPhone outbound-number options', () => {
	it('prefers outbound_eligible and falls back to the strict verified-VoIP heuristic', async () => {
		const request = vi.fn().mockResolvedValue([
			{
				id: 1,
				number: '+15550000001',
				outbound_eligible: false,
				source: 'voip',
				status: 'active',
				voip_verification_status: 'verified',
			},
			{
				id: 2,
				number: '+15550000002',
				outbound_eligible: true,
				source: 'demo',
				status: 'inactive',
			},
			{
				id: 3,
				number: '+15550000003',
				source: 'voip',
				status: 'active',
				voip_verification_status: 'carrier_accepted',
			},
			{
				id: 4,
				number: '+15550000004',
				source: 'voip',
				status: 'active',
				voip_verification_status: 'pending',
			},
		]);
		const context = { helpers: { httpRequestWithAuthentication: request } };

		const options = await new ThunderPhone().methods.loadOptions.getPhoneNumbers.call(
			context as never,
		);

		expect(options.map((option) => option.value)).toEqual(['+15550000002', '+15550000003']);
	});
});
