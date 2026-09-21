import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ThunderPhoneApi implements ICredentialType {
	name = 'thunderPhoneApi';

	displayName = 'ThunderPhone API';

	icon: Icon = {
		light: 'file:../icons/thunderphone.svg',
		dark: 'file:../icons/thunderphone.dark.svg',
	};

	documentationUrl = 'https://thunderphone.com/docs/guides/api-keys';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'sk_live_...',
			description: 'Server API key from Organization > Keys',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.thunderphone.com',
			url: '/v1/calls',
			method: 'GET',
			qs: { limit: 1 },
		},
	};
}
