import { getStore } from '@netlify/blobs';
import design from '../lib/prolific-design.mjs';
import { createHandler } from '../lib/allocation-handler.mjs';

async function checkedFetch(input, options) {
  const response = await fetch(input, options);
  if (!response.ok && ![304, 404, 412].includes(response.status)) throw Error('Private storage request failed');
  return response;
}

export default async request => {
  const options = { consistency: 'strong', fetch: checkedFetch };
  return createHandler({
    store: getStore({ name: 'facade-prolific-allocation', ...options }),
    responses: getStore({ name: 'facade-prolific-responses', ...options }),
    design
  })(request);
};
