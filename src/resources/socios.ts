import { Resource } from './base.js';
import { normalizeHashSocio, query } from '../utils.js';
import type { SocioEmpresasResponse } from '../models.js';
import type { ListarRelacionadosParams } from '../types.js';

export class SociosResource extends Resource {
  /**
   * Empresas em que o sócio participa. O `hashSocio` vem de `obterRelacionamentos` (`socios[].hashSocio`).
   * Com `socio.vinculoVerificavel === false` o hash é provisório: não guarde.
   */
  async listarEmpresas(hashSocio: string, params: ListarRelacionadosParams = {}): Promise<SocioEmpresasResponse> {
    const { signal, ...rest } = params;
    return this.client.request({ method: 'GET', path: `/v1/socios/${normalizeHashSocio(hashSocio)}/empresas${query(rest)}`, signal });
  }
}
