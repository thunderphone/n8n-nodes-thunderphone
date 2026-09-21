import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { eventTypesForTrigger, verifyThunderPhoneSignature } from './TriggerHelpers';

describe('verifyThunderPhoneSignature', () => {
	it('accepts the HMAC of the exact raw request body', () => {
		const secret = 'a'.repeat(48);
		const body = Buffer.from('{"data":{"call_id":42},"event_id":"evt","type":"call.graded"}');
		const signature = createHmac('sha256', secret).update(body).digest('hex');

		expect(verifyThunderPhoneSignature(body, signature, secret)).toBe(true);
	});

	it('rejects a signature when JSON whitespace changes', () => {
		const secret = 'b'.repeat(48);
		const canonicalBody = '{"data":{"call_id":42},"type":"call.graded"}';
		const signature = createHmac('sha256', secret).update(canonicalBody).digest('hex');

		expect(
			verifyThunderPhoneSignature(
				'{ "data": { "call_id": 42 }, "type": "call.graded" }',
				signature,
				secret,
			),
		).toBe(false);
	});

	it('rejects missing and malformed signatures', () => {
		expect(verifyThunderPhoneSignature('{}', undefined, 'secret')).toBe(false);
		expect(verifyThunderPhoneSignature('{}', 'short', 'secret')).toBe(false);
	});
});

describe('eventTypesForTrigger', () => {
	it('subscribes Call Completed to phone and web completion events', () => {
		expect(eventTypesForTrigger('callCompleted')).toEqual(['telephony.complete', 'web.complete']);
	});


	it('does not expose events that are absent from the production API', () => {
		expect(() => eventTypesForTrigger('callDataExtracted' as never)).toThrow();
	});
});
