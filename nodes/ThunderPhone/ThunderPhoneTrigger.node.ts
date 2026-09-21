import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { errorStatusCode, responseObjects, thunderPhoneApiRequest } from './GenericFunctions';
import {
	eventTypesForTrigger,
	type ThunderPhoneTriggerEvent,
	verifyThunderPhoneSignature,
} from './TriggerHelpers';

interface WebhookEndpoint extends IDataObject {
	id: string;
	url: string;
	events: string[];
}

function sameEvents(left: string[], right: string[]): boolean {
	return left.length === right.length && left.every((event) => right.includes(event));
}

function signatureHeader(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

export class ThunderPhoneTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ThunderPhone Trigger',
		name: 'thunderPhoneTrigger',
		icon: {
			light: 'file:../../icons/thunderphone.svg',
			dark: 'file:../../icons/thunderphone.dark.svg',
		},
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Start a workflow from a signed ThunderPhone webhook event',
		defaults: { name: 'ThunderPhone Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'thunderPhoneApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				required: true,
				options: [
					{
						name: 'Call Completed',
						value: 'callCompleted',
						description: 'A phone or web call ended',
					},
					{
						name: 'Call Graded',
						value: 'callGraded',
						description: 'A call grading run completed',
					},
				],
				default: 'callCompleted',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookId = webhookData.webhookId as string | undefined;
				const secret = webhookData.webhookSecret as string | undefined;
				if (!webhookId) return false;

				const response = await thunderPhoneApiRequest.call(
					this,
					'GET',
					'/v1/developer/webhook-endpoints',
				);
				const endpoint = responseObjects(response).find(
					(candidate) => String(candidate.id) === webhookId,
				) as WebhookEndpoint | undefined;
				if (!endpoint) {
					delete webhookData.webhookId;
					delete webhookData.webhookSecret;
					return false;
				}

				const event = this.getNodeParameter('event') as ThunderPhoneTriggerEvent;
				const expectedEvents = eventTypesForTrigger(event);
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (secret && endpoint.url === webhookUrl && sameEvents(endpoint.events, expectedEvents)) {
					return true;
				}

				// A changed node URL/event or a lost one-time secret cannot be adopted safely.
				// Delete the old endpoint before create() registers a fresh signed endpoint.
				await thunderPhoneApiRequest.call(
					this,
					'DELETE',
					`/v1/developer/webhook-endpoints/${webhookId}`,
				);
				delete webhookData.webhookId;
				delete webhookData.webhookSecret;
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as ThunderPhoneTriggerEvent;
				const workflowName = this.getWorkflow().name || 'workflow';
				const label = `n8n: ${workflowName}`.slice(0, 120);
				const response = (await thunderPhoneApiRequest.call(
					this,
					'POST',
					'/v1/developer/webhook-endpoints',
					{
						label,
						url: this.getNodeWebhookUrl('default'),
						events: eventTypesForTrigger(event),
					},
				)) as IDataObject;

				if (typeof response.id !== 'string' || typeof response.secret !== 'string') {
					throw new NodeOperationError(
						this.getNode(),
						'ThunderPhone did not return a webhook ID and signing secret.',
					);
				}
				webhookData.webhookId = response.id;
				webhookData.webhookSecret = response.secret;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookId = webhookData.webhookId as string | undefined;
				if (!webhookId) {
					delete webhookData.webhookSecret;
					return true;
				}
				try {
					await thunderPhoneApiRequest.call(
						this,
						'DELETE',
						`/v1/developer/webhook-endpoints/${webhookId}`,
					);
				} catch (error) {
					if (errorStatusCode(error) !== 404) return false;
				}
				delete webhookData.webhookId;
				delete webhookData.webhookSecret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const request = this.getRequestObject();
		const response = this.getResponseObject();
		const webhookData = this.getWorkflowStaticData('node');
		const secret = webhookData.webhookSecret as string | undefined;
		const signature = signatureHeader(this.getHeaderData()['x-thunderphone-signature']);

		if (
			!secret ||
			!request.rawBody ||
			!verifyThunderPhoneSignature(request.rawBody, signature, secret)
		) {
			response.status(401).send('Invalid ThunderPhone signature').end();
			return { noWebhookResponse: true };
		}

		const payload = request.body as IDataObject;
		const event = this.getNodeParameter('event') as ThunderPhoneTriggerEvent;
		if (!eventTypesForTrigger(event).includes(String(payload.type))) {
			response.status(202).send('Ignored event').end();
			return { noWebhookResponse: true };
		}

		return { workflowData: [this.helpers.returnJsonArray(payload)] };
	}
}
