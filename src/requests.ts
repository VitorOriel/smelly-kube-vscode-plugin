import fetch from 'node-fetch';

import { Response, RequestError } from './models';

export function sendFile(apiUrl: string, bodyData: any): Promise<Response> {
	return new Promise<Response>(async (resolve, reject) => {
		try {
			// Make an HTTP POST request
			const response = await fetch(apiUrl, {
				method: 'POST',
				body: JSON.stringify(bodyData),
				headers: {
					'Content-Type': 'application/json',
				}
			});
			// Check if the request was successful (status code 2xx)
			if (response.ok) {
				const data = await response.json() as Response;
				resolve(data);
			} else {
				reject({message: `Request failed with status: ${response.status}`} as RequestError);
			}
		} catch (error) {
			reject({message: `Error making request: ${error}`} as RequestError);
		}
	});
}