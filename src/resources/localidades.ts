import { Resource } from './base.js';
import type { NextApiClient } from '../client.js';
import { positiveInt, query } from '../utils.js';
import type {
  CnaeItemResponse,
  EstadoItemResponse,
  MunicipioDetalhadoResponse,
  MunicipioItemResponse,
  Page,
} from '../models.js';
import type { ListarMunicipiosParams, PageParams, RequestOptions } from '../types.js';

export class CnaesResource extends Resource {
  async listar(params: PageParams & RequestOptions = {}): Promise<Page<CnaeItemResponse>> {
    const { signal, ...rest } = params;
    return this.client.request({ method: 'GET', path: `/v1/cnaes${query(rest)}`, signal });
  }
}

export class EstadosResource extends Resource {
  async listar(params: PageParams & RequestOptions = {}): Promise<Page<EstadoItemResponse>> {
    const { signal, ...rest } = params;
    return this.client.request({ method: 'GET', path: `/v1/estados${query(rest)}`, signal });
  }
}

export class MunicipiosResource extends Resource {
  async listar(params: ListarMunicipiosParams = {}): Promise<Page<MunicipioItemResponse>> {
    const { signal, ...rest } = params;
    return this.client.request({ method: 'GET', path: `/v1/municipios${query(rest)}`, signal });
  }

  /** Município pelo código da Receita (o `id` de `listar`), com a hierarquia do IBGE. */
  async obterPorId(id: number, options: RequestOptions = {}): Promise<MunicipioDetalhadoResponse> {
    return this.client.request({ method: 'GET', path: `/v1/municipios/${positiveInt(id, 'id')}`, signal: options.signal });
  }
}

/** @internal */
export class LocalidadesResources {
  readonly cnaes: CnaesResource;
  readonly estados: EstadosResource;
  readonly municipios: MunicipiosResource;
  constructor(client: NextApiClient) {
    this.cnaes = new CnaesResource(client);
    this.estados = new EstadosResource(client);
    this.municipios = new MunicipiosResource(client);
  }
}
