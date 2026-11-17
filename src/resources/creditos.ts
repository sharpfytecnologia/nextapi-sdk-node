import { Resource } from './base.js';
import type { WorkspaceCreditsResponse } from '../models.js';
import type { RequestOptions } from '../types.js';

export class CreditosResource extends Resource {
  /** Saldo de créditos do plano e avulsos, e os limites da chave. Não consome crédito. */
  async consultar(options: RequestOptions = {}): Promise<WorkspaceCreditsResponse> {
    return this.client.request({ method: 'GET', path: '/v1/credits', signal: options.signal });
  }
}
