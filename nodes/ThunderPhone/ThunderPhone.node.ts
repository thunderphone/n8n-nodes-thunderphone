import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { thunderPhoneProperties } from './Descriptions';
import { errorStatusCode, responseObjects, thunderPhoneApiRequest } from './GenericFunctions';

function jsonObjectParameter(
	context: IExecuteFunctions,
	value: unknown,
	fieldName: string,
	itemIndex: number,
): IDataObject {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as IDataObject;
	}
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value) as unknown;
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return parsed as IDataObject;
			}
		} catch {
			// The error below gives the user a field-specific message.
		}
	}
	throw new NodeOperationError(context.getNode(), `${fieldName} must be a JSON object.`, {
		itemIndex,
	});
}

function contactsParameter(
	context: IExecuteFunctions,
	value: unknown,
	itemIndex: number,
): IDataObject[] {
	let parsed = value;
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value) as unknown;
		} catch {
			throw new NodeOperationError(context.getNode(), 'Contacts must be a valid JSON array.', {
				itemIndex,
			});
		}
	}
	if (
		!Array.isArray(parsed) ||
		!parsed.every((contact) => contact && typeof contact === 'object')
	) {
		throw new NodeOperationError(context.getNode(), 'Contacts must be a JSON array of objects.', {
			itemIndex,
		});
	}
	return parsed as IDataObject[];
}

function outputItems(response: unknown, itemIndex: number): INodeExecutionData[] {
	return responseObjects(response).map((json) => ({ json, pairedItem: { item: itemIndex } }));
}

export function isOutboundEligible(phone: IDataObject): boolean {
	if (typeof phone.outbound_eligible === 'boolean') {
		return phone.outbound_eligible;
	}
	return (
		phone.source === 'voip' &&
		phone.status === 'active' &&
		['verified', 'carrier_accepted'].includes(String(phone.voip_verification_status))
	);
}

export function outboundIdempotencyKey(
	context: IExecuteFunctions,
	mappedValue: unknown,
	itemIndex: number,
): string {
	const stableRecordKey = typeof mappedValue === 'string' ? mappedValue.trim() : '';
	if (!stableRecordKey) {
		throw new NodeOperationError(
			context.getNode(),
			'Idempotency Key must be mapped to a stable upstream record or event ID.',
			{ itemIndex },
		);
	}
	const key = `n8n:${context.getNode().id}:${stableRecordKey}`;
	if (key.length > 128) {
		throw new NodeOperationError(
			context.getNode(),
			'Idempotency Key is too long after adding the stable n8n node ID (128 characters maximum).',
			{ itemIndex },
		);
	}
	return key;
}

function campaignContactsResult(
	context: IExecuteFunctions,
	response: unknown,
	itemIndex: number,
): IDataObject {
	const result = response as IDataObject;
	const accepted = Number(result.accepted ?? 0);
	const rejected = Number(result.rejected ?? 0);
	if (accepted === 0) {
		throw new NodeOperationError(
			context.getNode(),
			`ThunderPhone rejected every campaign contact: ${JSON.stringify(result.errors ?? [])}`,
			{ itemIndex },
		);
	}
	return { ...result, partial_success: rejected > 0 };
}

export class ThunderPhone implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ThunderPhone',
		name: 'thunderPhone',
		icon: {
			light: 'file:../../icons/thunderphone.svg',
			dark: 'file:../../icons/thunderphone.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Work with ThunderPhone calls, campaigns, agents, and phone numbers',
		defaults: { name: 'ThunderPhone' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'thunderPhoneApi', required: true }],
		properties: thunderPhoneProperties,
	};

	methods = {
		loadOptions: {
			async getAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await thunderPhoneApiRequest.call(this, 'GET', '/v1/agents');
				return responseObjects(response).map((agent) => ({
					name: String(agent.name ?? agent.id),
					value: Number(agent.id),
				}));
			},
			async getPhoneNumbers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await thunderPhoneApiRequest.call(this, 'GET', '/v1/phone-numbers');
				return responseObjects(response)
					.filter(isOutboundEligible)
					.map((phone) => ({
						name: phone.label
							? `${String(phone.label)} (${String(phone.number)})`
							: String(phone.number),
						value: String(phone.number),
					}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < inputItems.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				let response: unknown;

				if (resource === 'outboundCall' && operation === 'place') {
					const idempotencyKey = outboundIdempotencyKey(
						this,
						this.getNodeParameter('idempotencyKey', itemIndex),
						itemIndex,
					);
					const variables = jsonObjectParameter(
						this,
						this.getNodeParameter('variables', itemIndex, {}),
						'Variables',
						itemIndex,
					);
					const body: IDataObject = {
						agent_id: this.getNodeParameter('agentId', itemIndex) as number,
						from_number: this.getNodeParameter('fromNumber', itemIndex) as string,
						to_number: this.getNodeParameter('toNumber', itemIndex) as string,
						variables,
						idempotency_key: idempotencyKey,
					};
					response = await thunderPhoneApiRequest.call(this, 'POST', '/v1/call', body);
				} else if (resource === 'call' && operation === 'get') {
					const callId = this.getNodeParameter('callId', itemIndex) as number;
					const call = (await thunderPhoneApiRequest.call(
						this,
						'GET',
						`/v1/calls/${callId}`,
					)) as IDataObject;
					const transcript = (await thunderPhoneApiRequest.call(
						this,
						'GET',
						`/v1/calls/${callId}/transcript`,
					)) as IDataObject;
					let recordingUrl: string | null = null;
					try {
						const recording = (await thunderPhoneApiRequest.call(
							this,
							'GET',
							`/v1/calls/${callId}/audio`,
						)) as IDataObject;
						recordingUrl = typeof recording.url === 'string' ? recording.url : null;
					} catch (error) {
						if (errorStatusCode(error) !== 404) {
							throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
						}
					}
					response = {
						...call,
						transcripts: transcript.transcripts ?? [],
						recording_url: recordingUrl,
					};
				} else if (resource === 'search' && operation === 'findCall') {
					const callId = this.getNodeParameter('callId', itemIndex) as number;
					response = await thunderPhoneApiRequest.call(this, 'GET', `/v1/calls/${callId}`);
				} else if (resource === 'campaign' && operation === 'addContacts') {
					const campaignId = this.getNodeParameter('campaignId', itemIndex) as string;
					const contacts = contactsParameter(
						this,
						this.getNodeParameter('contacts', itemIndex),
						itemIndex,
					);
					const addContactsResponse = await thunderPhoneApiRequest.call(
						this,
						'POST',
						`/v1/campaigns/${campaignId}/contacts`,
						{ contacts },
					);
					response = campaignContactsResult(this, addContactsResponse, itemIndex);
				} else if (resource === 'campaign' && operation === 'start') {
					const campaignId = this.getNodeParameter('campaignId', itemIndex) as string;
					const consentToCharge = this.getNodeParameter('consentToCharge', itemIndex) as boolean;
					if (!consentToCharge) {
						throw new NodeOperationError(
							this.getNode(),
							'Confirm that starting the campaign places real calls and spends credits.',
							{ itemIndex },
						);
					}
					response = await thunderPhoneApiRequest.call(
						this,
						'POST',
						`/v1/campaigns/${campaignId}/start`,
						{ consent_to_charge: true },
					);
				} else if (resource === 'agent' && operation === 'list') {
					response = await thunderPhoneApiRequest.call(this, 'GET', '/v1/agents');
				} else if (resource === 'phoneNumber' && operation === 'list') {
					response = await thunderPhoneApiRequest.call(this, 'GET', '/v1/phone-numbers');
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported operation: ${resource}.${operation}`,
						{ itemIndex },
					);
				}

				returnData.push(...outputItems(response, itemIndex));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: inputItems[itemIndex].json,
						error,
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [returnData];
	}
}
