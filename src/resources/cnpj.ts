import { Resource } from './base.js';
import { batch, normalizeCnpj, query } from '../utils.js';
import type {
  CnpjConformidadeResponse,
  CnpjInscricaoEstadualResponse,
  CnpjItemResponse,
  CnpjRelacionamentoResponse,
  CnpjSimplesResponse,
} from '../models.js';
import type { ConsultarCnpjParams, ListarRelacionadosParams, RequestOptions } from '../types.js';

/** Consultas por CNPJ. Aceita o CNPJ com ou sem pontuação, numérico ou alfanumérico. */
export class CnpjResource extends Resource {
  /**
   * Dados cadastrais do estabelecimento. 1 crédito.
   * @example const empresa = await nextapi.cnpj.consultar('11.222.333/0001-81');
   */
  async consultar(cnpj: string, params: ConsultarCnpjParams = {}): Promise<CnpjItemResponse> {
    const { signal, toleranceDays } = params;
    return this.client.request({ method: 'GET', path: `/v1/cnpj/${normalizeCnpj(cnpj)}${query({ toleranceDays })}`, signal });
  }

  /** O mesmo que `consultar` com `toleranceDays: 0`: força a consulta em tempo real ao provedor (exige plano que permita). */
  async consultarAoVivo(cnpj: string, options: RequestOptions = {}): Promise<CnpjItemResponse> {
    return this.consultar(cnpj, { ...options, toleranceDays: 0 });
  }

  /** Situação no Simples Nacional e no MEI. */
  async obterSimples(cnpj: string, params: ConsultarCnpjParams = {}): Promise<CnpjSimplesResponse> {
    const { signal, toleranceDays } = params;
    return this.client.request({ method: 'GET', path: `/v1/cnpj/${normalizeCnpj(cnpj)}/simples${query({ toleranceDays })}`, signal });
  }

  /** Inscrições estaduais do estabelecimento, uma por UF. */
  async obterInscricoesEstaduais(cnpj: string, options: RequestOptions = {}): Promise<CnpjInscricaoEstadualResponse[]> {
    return this.client.request({ method: 'GET', path: `/v1/cnpj/${normalizeCnpj(cnpj)}/ie`, signal: options.signal });
  }

  /** Sanções (CEIS, CNEP, CEPIM) e dívida ativa da União. Planos pagos ou créditos avulsos. */
  async obterConformidade(cnpj: string, options: RequestOptions = {}): Promise<CnpjConformidadeResponse> {
    return this.client.request({ method: 'GET', path: `/v1/cnpj/${normalizeCnpj(cnpj)}/conformidade`, signal: options.signal });
  }

  /** Sócios e empresas ligadas pelos mesmos sócios (grupo econômico), paginado. */
  async obterRelacionamentos(cnpj: string, params: ListarRelacionadosParams = {}): Promise<CnpjRelacionamentoResponse> {
    const { signal, ...rest } = params;
    return this.client.request({ method: 'GET', path: `/v1/cnpj/${normalizeCnpj(cnpj)}/relacionamentos${query(rest)}`, signal });
  }

  /** Até 100 CNPJs numa chamada; 1 crédito por CNPJ encontrado. Não é repetida automaticamente em falha. */
  async consultarLote(cnpjs: readonly string[], options: RequestOptions = {}): Promise<CnpjItemResponse[]> {
    return this.client.request({ method: 'POST', path: '/v1/cnpj/batch', body: { cnpjs: batch(cnpjs) }, signal: options.signal });
  }

  /** Simples Nacional de até 100 CNPJs numa chamada. Não é repetida automaticamente em falha. */
  async obterSimplesLote(cnpjs: readonly string[], options: RequestOptions = {}): Promise<CnpjSimplesResponse[]> {
    return this.client.request({ method: 'POST', path: '/v1/cnpj/batch/simples', body: { cnpjs: batch(cnpjs) }, signal: options.signal });
  }
}
