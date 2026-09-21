import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export const THUNDERPHONE_API_BASE_URL = 'https://api.thunderphone.com';

export type ThunderPhoneRequestContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

export async function thunderPhoneApiRequest(
	this: ThunderPhoneRequestContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | IDataObject[] = {},
	qs: IDataObject = {},
): Promise<unknown> {
	const options: IHttpRequestOptions = {
		method,
		baseURL: THUNDERPHONE_API_BASE_URL,
		url: endpoint,
		qs,
		json: true,
	};

	if (method !== 'GET' && method !== 'DELETE') {
		options.body = body;
	}

	return await this.helpers.httpRequestWithAuthentication.call(this, 'thunderPhoneApi', options);
}

export function responseObjects(response: unknown): IDataObject[] {
	if (Array.isArray(response)) {
		return response as IDataObject[];
	}
	return [response as IDataObject];
}

export function errorStatusCode(error: unknown): number | undefined {
	if (!error || typeof error !== 'object') return undefined;

	const candidate = error as {
		httpCode?: number | string;
		statusCode?: number;
		response?: { status?: number; statusCode?: number };
	};
	const value =
		candidate.statusCode ??
		candidate.response?.statusCode ??
		candidate.response?.status ??
		candidate.httpCode;
	const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
	return Number.isFinite(parsed) ? parsed : undefined;
}
