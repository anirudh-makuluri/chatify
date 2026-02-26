import { customFetch } from './utils';
import type { SemanticSearchResponse } from './types';

const API = 'api';

export async function semanticSearch(roomId: string, query: string): Promise<SemanticSearchResponse> {
	const params = new URLSearchParams({ roomId, query });
	const pathName = `${API}/search?${params.toString()}`;
	return customFetch({ pathName, method: 'GET' }) as Promise<SemanticSearchResponse>;
}
