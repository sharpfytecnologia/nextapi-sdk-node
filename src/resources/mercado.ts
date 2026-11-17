import { Resource } from './base.js';
import { pathSegment, positiveInt, query } from '../utils.js';
import type { MercadoCnaeResponse, MercadoIndicadorResponse, MercadoMunicipioResponse } from '../models.js';
import type { MercadoCnaeParams, MercadoIndicadorParams, RequestOptions } from '../types.js';

/** Dados de mercado agregados. Planos pagos ou créditos avulsos. */
export class MercadoResource extends Resource {
  /** Empresas ativas, aberturas e baixas de um CNAE (com ou sem pontuação), no Brasil ou numa UF. */
  async obterCnae(cnae: string, params: MercadoCnaeParams = {}): Promise<MercadoCnaeResponse> {
    const { signal, ...rest } = params;
    const codigo = pathSegment(String(cnae ?? '').replace(/[\s./-]/g, ''), 'cnae');
    return this.client.request({ method: 'GET', path: `/v1/mercado/cnaes/${codigo}${query(rest)}`, signal });
  }

  /** Empresas e economia (PIB, população) de um município, pelo código da Receita. */
  async obterMunicipio(id: number, options: RequestOptions = {}): Promise<MercadoMunicipioResponse> {
    return this.client.request({ method: 'GET', path: `/v1/mercado/municipios/${positiveInt(id, 'id')}`, signal: options.signal });
  }

  /** Série de um indicador econômico (ex.: `ipca`), de `inicio` a `fim` (`AAAAMM`). */
  async obterIndicador(tipo: string, params: MercadoIndicadorParams = {}): Promise<MercadoIndicadorResponse> {
    const { signal, ...rest } = params;
    return this.client.request({ method: 'GET', path: `/v1/mercado/indicadores/${pathSegment(tipo, 'tipo')}${query(rest)}`, signal });
  }
}
