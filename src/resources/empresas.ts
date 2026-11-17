import { Resource } from './base.js';
import { query } from '../utils.js';
import type { CnpjSimplifiedResponse, Page } from '../models.js';
import type { PesquisarEmpresasParams } from '../types.js';

export class EmpresasResource extends Resource {
  /** Pesquisa de empresas por filtros (UF, município, CNAE, CEP, situação, data de abertura, texto). */
  async pesquisar(params: PesquisarEmpresasParams = {}): Promise<Page<CnpjSimplifiedResponse>> {
    const { signal, ...rest } = params;
    return this.client.request({ method: 'GET', path: `/v1/empresas${query(rest)}`, signal });
  }
}
