import type { NextApiClient } from '../client.js';

/** @internal */
export abstract class Resource {
  constructor(protected readonly client: NextApiClient) {}
}
