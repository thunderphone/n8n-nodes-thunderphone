import { createHmac, timingSafeEqual } from 'node:crypto';

export type ThunderPhoneTriggerEvent = 'callCompleted' | 'callGraded';

const EVENT_TYPES: Record<ThunderPhoneTriggerEvent, string[]> = {
	callCompleted: ['telephony.complete', 'web.complete'],
	callGraded: ['call.graded'],
};

export function eventTypesForTrigger(event: ThunderPhoneTriggerEvent): string[] {
	return [...EVENT_TYPES[event]];
}

export function verifyThunderPhoneSignature(
	rawBody: Buffer | string,
	signature: string | undefined,
	secret: string,
): boolean {
	if (!signature || !secret) return false;

	const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
	const expectedBytes = Buffer.from(expected);
	const actualBytes = Buffer.from(signature);
	if (expectedBytes.length !== actualBytes.length) return false;
	return timingSafeEqual(expectedBytes, actualBytes);
}
