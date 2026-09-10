import { getStore } from '@netlify/blobs';
import design from '../lib/allocation-design.json' with { type: 'json' };
import { createHandler } from '../lib/allocation-handler.mjs';

// Fail closed on upstream errors, including SDK conditional-write failure cases.
async function checkedFetch(input, options) {
  const response = await fetch(input, options);
  if (!response.ok && ![304, 404, 412].includes(response.status)) throw Error('Private storage request failed');
  return response;
}

export default async request => {
  const options = { consistency: 'strong', fetch: checkedFetch };
  const store = getStore({ name: 'facade-local-allocation', ...options });
  const responses = getStore({ name: 'facade-local-responses', ...options });
  return createHandler({ store, responses, design })(request);
};
