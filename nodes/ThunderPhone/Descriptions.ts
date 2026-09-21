import type { INodeProperties } from 'n8n-workflow';

const agentIdProperty: INodeProperties = {
	displayName: 'Agent Name or ID',
	name: 'agentId',
	type: 'options',
	typeOptions: { loadOptionsMethod: 'getAgents' },
	required: true,
	default: '',
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
};

const fromNumberProperty: INodeProperties = {
	displayName: 'Phone Number Name or ID',
	name: 'fromNumber',
	type: 'options',
	typeOptions: { loadOptionsMethod: 'getPhoneNumbers' },
	required: true,
	default: '',
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
};

export const thunderPhoneProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Agent', value: 'agent' },
			{ name: 'Call', value: 'call' },
			{ name: 'Campaign', value: 'campaign' },
			{ name: 'Outbound Call', value: 'outboundCall' },
			{ name: 'Phone Number', value: 'phoneNumber' },
			{ name: 'Search', value: 'search' },
		],
		default: 'outboundCall',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['outboundCall'] } },
		options: [{ name: 'Place', value: 'place', action: 'Place an outbound call' }],
		default: 'place',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['call'] } },
		options: [{ name: 'Get', value: 'get', action: 'Get a call' }],
		default: 'get',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['campaign'] } },
		options: [
			{ name: 'Add Contacts', value: 'addContacts', action: 'Add contacts to a campaign' },
			{ name: 'Start', value: 'start', action: 'Start a campaign' },
		],
		default: 'addContacts',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['agent'] } },
		options: [{ name: 'List', value: 'list', action: 'List agents' }],
		default: 'list',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['phoneNumber'] } },
		options: [{ name: 'List', value: 'list', action: 'List phone numbers' }],
		default: 'list',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['search'] } },
		options: [{ name: 'Find Call by ID', value: 'findCall', action: 'Find a call by ID' }],
		default: 'findCall',
	},
	{
		...agentIdProperty,
		displayOptions: { show: { resource: ['outboundCall'], operation: ['place'] } },
	},
	{
		...fromNumberProperty,
		displayOptions: { show: { resource: ['outboundCall'], operation: ['place'] } },
	},
	{
		displayName: 'To Number',
		name: 'toNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '+14155550199',
		description: 'Destination in E.164 format',
		displayOptions: { show: { resource: ['outboundCall'], operation: ['place'] } },
	},
	{
		displayName: 'Variables',
		name: 'variables',
		type: 'json',
		default: '{}',
		description: 'Values for placeholders in the saved agent prompt',
		displayOptions: { show: { resource: ['outboundCall'], operation: ['place'] } },
	},
	{
		displayName: 'Idempotency Key',
		name: 'idempotencyKey',
		type: 'string',
		required: true,
		default: '',
		description:
			'Map a stable ID from the upstream record or event that triggered this call (for example, a CRM record ID). The same logical event must keep the same value across automatic retries and Retry execution. Do not use timestamps, random values, n8n execution IDs, or workflow IDs. This node adds its stable node ID so two ThunderPhone nodes can safely receive the same mapped value.',
		displayOptions: { show: { resource: ['outboundCall'], operation: ['place'] } },
	},
	{
		displayName: 'Call ID',
		name: 'callId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: {
			show: { resource: ['call', 'search'], operation: ['get', 'findCall'] },
		},
	},
	{
		displayName: 'Campaign ID',
		name: 'campaignId',
		type: 'string',
		required: true,
		default: '',
		description: 'Campaign UUID',
		displayOptions: {
			show: { resource: ['campaign'], operation: ['addContacts', 'start'] },
		},
	},
	{
		displayName: 'Contacts',
		name: 'contacts',
		type: 'json',
		required: true,
		default: '[{"phone_number":"+14155550199"}]',
		description:
			'JSON array of contacts. Each contact needs phone_number; all other keys become call variables.',
		displayOptions: { show: { resource: ['campaign'], operation: ['addContacts'] } },
	},
	{
		displayName:
			'I Confirm That Starting This Campaign Places Real Calls and Spends ThunderPhone Credits',
		name: 'consentToCharge',
		type: 'boolean',
		required: true,
		default: false,
		displayOptions: { show: { resource: ['campaign'], operation: ['start'] } },
	},
];
