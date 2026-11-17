export * from './models.js';

/** Opções do cliente. Todas são opcionais: a chave pode vir de `NEXTAPI_KEY`. */
export interface NextApiClientOptions {
  /** Chave de API (`nxa_live_…` em produção, `nxa_test_…` no sandbox). Padrão: `process.env.NEXTAPI_KEY`. */
  apiKey?: string;
  /** Endereço da API. Padrão `https://api.nextapi.com.br`; só `https` (ou `http://localhost`). */
  baseUrl?: string;
  /** Tempo máximo de cada tentativa, em ms. Padrão 30 000. */
  timeoutMs?: number;
  /** Novas tentativas em falha transitória (429, 502, 503, 504, rede), só em leituras. Padrão 2. */
  maxRetries?: number;
  /** `fetch` alternativo (testes, proxies, runtimes sem `fetch` global). */
  fetch?: typeof fetch;
  /** Complemento do User-Agent, para identificar a sua aplicação (ex.: `"minha-app/1.2"`). */
  appInfo?: string;
}

/** Opções de cada chamada. */
export interface RequestOptions {
  /** Cancela a chamada (ex.: `AbortSignal.timeout(5000)` ou o sinal da requisição HTTP de entrada). */
  signal?: AbortSignal;
}

export interface PageParams {
  /** Página, a partir de 1. */
  page?: number;
  /** Itens por página (o máximo depende da rota, em geral 100). */
  pageSize?: number;
}

export interface ConsultarCnpjParams extends RequestOptions {
  /** Idade máxima aceita do dado em cache, em dias (0 a 45). 0 força a consulta em tempo real ao provedor. */
  toleranceDays?: number;
}

export interface ListarRelacionadosParams extends PageParams, RequestOptions {
  /** Inclui empresas baixadas, inaptas e suspensas. Padrão `false`. */
  incluirInativas?: boolean;
}

export interface BuscarCepsParams extends PageParams, RequestOptions {
  uf?: string;
  /** Código do município (o `id` de `/v1/municipios`). */
  idMunicipio?: number;
  nomeMunicipio?: string;
  logradouro?: string;
  /** Busca livre por texto. Não combina com `logradouro`. */
  q?: string;
}

export interface BuscarProximosParams extends PageParams, RequestOptions {
  latitude: number;
  longitude: number;
  /** Raio da busca em metros (maior que zero). */
  raioMetro: number;
}

export interface BuscarProximosDoCepParams extends PageParams, RequestOptions {
  /** Raio da busca em metros (maior que zero). */
  raioMetro: number;
}

export interface PesquisarEmpresasParams extends PageParams, RequestOptions {
  /** Busca livre por razão social ou nome fantasia. */
  q?: string;
  uf?: string;
  codigoMunicipio?: string;
  cnpjRaiz?: string;
  cnpj?: string;
  /** Data mínima de abertura (`Date` ou `AAAA-MM-DD`). */
  dataAberturaInicio?: Date | string;
  dataAberturaFim?: Date | string;
  codigoSituacaoCadastral?: string;
  /** CEPs separados por vírgula. */
  ceps?: string;
  /** CNAEs separados por vírgula. */
  cnaes?: string;
}

export interface ListarMunicipiosParams extends PageParams, RequestOptions {
  uf?: string;
}

export interface MercadoCnaeParams extends RequestOptions {
  uf?: string;
  /** Meses da série de aberturas e baixas (padrão 24, máximo 60). */
  meses?: number;
}

export interface MercadoIndicadorParams extends RequestOptions {
  /** Primeiro período, `AAAAMM`. */
  inicio?: string;
  /** Último período, `AAAAMM`. */
  fim?: string;
}
