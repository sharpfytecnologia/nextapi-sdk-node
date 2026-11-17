import { Resource } from './base.js';
import { normalizeCep, query, requirePositive, requireRange } from '../utils.js';
import type { CepItemResponse, Page } from '../models.js';
import type { BuscarCepsParams, BuscarProximosDoCepParams, BuscarProximosParams, RequestOptions } from '../types.js';

export class CepsResource extends Resource {
  /** Endereço e coordenadas de um CEP. */
  async consultar(cep: string, options: RequestOptions = {}): Promise<CepItemResponse> {
    return this.client.request({ method: 'GET', path: `/v1/ceps/${normalizeCep(cep)}`, signal: options.signal });
  }

  /** Busca por UF, município, logradouro ou texto livre (`q`, que não combina com `logradouro`). */
  async buscar(params: BuscarCepsParams = {}): Promise<Page<CepItemResponse>> {
    const { signal, ...rest } = params;
    return this.client.request({ method: 'GET', path: `/v1/ceps${query(rest)}`, signal });
  }

  /** CEPs num raio (em metros) ao redor de uma coordenada. */
  async buscarProximos(params: BuscarProximosParams): Promise<Page<CepItemResponse>> {
    const { signal, ...rest } = params;
    requireRange(rest.latitude, -90, 90, 'latitude');
    requireRange(rest.longitude, -180, 180, 'longitude');
    requirePositive(rest.raioMetro, 'raioMetro');
    return this.client.request({ method: 'GET', path: `/v1/ceps/geo${query(rest)}`, signal });
  }

  /** CEPs num raio (em metros) ao redor de outro CEP. */
  async buscarProximosDoCep(cep: string, params: BuscarProximosDoCepParams): Promise<Page<CepItemResponse>> {
    const { signal, ...rest } = params;
    requirePositive(rest?.raioMetro, 'raioMetro');
    return this.client.request({ method: 'GET', path: `/v1/ceps/geo/${normalizeCep(cep)}${query(rest)}`, signal });
  }
}
