import {
  ErrorCodes,
  NextApiAuthenticationError,
  NextApiConnectionError,
  NextApiError,
  NextApiInsufficientCreditsError,
  NextApiNotFoundError,
  NextApiPaidPlanRequiredError,
  NextApiRateLimitError,
  NextApiServerError,
  NextApiValidationError,
  type NextApiErrorInit,
} from './errors.js';
import { backoffMs, retryAfterMs } from './utils.js';
import type { NextApiClientOptions } from './types.js';
import { CnpjResource } from './resources/cnpj.js';
import { SociosResource } from './resources/socios.js';
import { CepsResource } from './resources/ceps.js';
import { EmpresasResource } from './resources/empresas.js';
import { LocalidadesResources, CnaesResource, EstadosResource, MunicipiosResource } from './resources/localidades.js';
import { MercadoResource } from './resources/mercado.js';
import { CreditosResource } from './resources/creditos.js';

export const VERSION = '0.2.0';
const DEFAULT_BASE_URL = 'https://api.nextapi.com.br';
const RETRYABLE = new Set([429, 502, 503, 504]);

/** @internal */
export interface Call {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Cliente da NextAPI. Sem dependências: usa o `fetch` do runtime (Node.js 22+, Deno, Bun, Workers).
 *
 * @example
 * ```ts
 * const nextapi = new NextApiClient(); // lê NEXTAPI_KEY
 * const empresa = await nextapi.cnpj.consultar('11.222.333/0001-81');
 * ```
 */
export class NextApiClient {
  readonly cnpj: CnpjResource;
  readonly socios: SociosResource;
  readonly ceps: CepsResource;
  readonly empresas: EmpresasResource;
  readonly cnaes: CnaesResource;
  readonly estados: EstadosResource;
  readonly municipios: MunicipiosResource;
  readonly mercado: MercadoResource;
  readonly creditos: CreditosResource;

  /** `sandbox` para chaves `nxa_test_`, `production` para as demais. O endereço é o mesmo: a API decide pela chave. */
  readonly environment: 'sandbox' | 'production';
  readonly baseUrl: string;

  // Campos privados de verdade: a chave não aparece em console.log, JSON.stringify nem no inspetor.
  readonly #apiKey: string;
  readonly #timeoutMs: number;
  readonly #maxRetries: number;
  readonly #fetch: typeof fetch;
  readonly #userAgent: string;
  readonly #clientInfo: string;

  constructor(options: NextApiClientOptions = {}) {
    const env = typeof process !== 'undefined' ? process.env : undefined;
    const apiKey = (options.apiKey ?? env?.NEXTAPI_KEY ?? '').trim();
    if (!apiKey) {
      throw new NextApiAuthenticationError({
        status: 0,
        message: 'Chave de API não informada: passe { apiKey } ou defina NEXTAPI_KEY.',
      });
    }
    this.#apiKey = apiKey;
    this.environment = apiKey.startsWith('nxa_test_') ? 'sandbox' : 'production';
    this.baseUrl = NextApiClient.#checkBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.#timeoutMs = options.timeoutMs ?? 30_000;
    this.#maxRetries = Math.max(0, Math.floor(options.maxRetries ?? 2));
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new TypeError('fetch não disponível neste runtime: passe { fetch } ou use Node.js 22+.');
    }
    this.#fetch = fetchImpl;
    const node = typeof process !== 'undefined' && process.versions?.node;
    const runtime = node ? `node/${node}` : 'js/0';
    const app = sanitizeAppInfo(options.appInfo);
    this.#userAgent = `nextapi-typescript/${VERSION} ${runtime}${app ? ` ${app}` : ''}`;
    this.#clientInfo = `${runtime}; ${node ? osName(process.platform) : 'browser'}${app ? `; ${app}` : ''}`;

    this.cnpj = new CnpjResource(this);
    this.socios = new SociosResource(this);
    this.ceps = new CepsResource(this);
    this.empresas = new EmpresasResource(this);
    const localidades = new LocalidadesResources(this);
    this.cnaes = localidades.cnaes;
    this.estados = localidades.estados;
    this.municipios = localidades.municipios;
    this.mercado = new MercadoResource(this);
    this.creditos = new CreditosResource(this);
  }

  static #checkBaseUrl(raw: string): string {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new TypeError(`baseUrl inválida: ${raw}`);
    }
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
      throw new TypeError('baseUrl tem de usar https (http só para localhost): a chave vai no cabeçalho.');
    }
    return url.origin + url.pathname.replace(/\/+$/, '');
  }

  /** @internal Usado pelos recursos. */
  async request<T>(call: Call): Promise<T> {
    const url = this.baseUrl + call.path;
    // POST de lote consome créditos: nunca repete sozinho.
    const retries = call.method === 'GET' ? this.#maxRetries : 0;

    for (let attempt = 0; ; attempt++) {
      let response: Response;
      const timeout = AbortSignal.timeout(this.#timeoutMs);
      const signal = call.signal ? AbortSignal.any([call.signal, timeout]) : timeout;
      try {
        response = await this.#fetch(url, {
          method: call.method,
          headers: {
            Authorization: `Bearer ${this.#apiKey}`,
            Accept: 'application/json',
            'User-Agent': this.#userAgent,
            'X-NextApi-Client': `typescript/${VERSION}`,
            'X-NextApi-Client-Info': this.#clientInfo,
            ...(call.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          body: call.body !== undefined ? JSON.stringify(call.body) : undefined,
          // Não segue redirecionamento: o cabeçalho com a chave iria junto para outro destino.
          redirect: 'manual',
          signal,
        });
      } catch (err) {
        if (call.signal?.aborted) throw call.signal.reason ?? err;
        if (attempt < retries) {
          await sleep(backoffMs(attempt + 1), call.signal);
          continue;
        }
        const message = timeout.aborted
          ? `Sem resposta da NextAPI em ${this.#timeoutMs} ms.`
          : `Falha de conexão com a NextAPI: ${err instanceof Error ? err.message : String(err)}`;
        throw new NextApiConnectionError({ status: 0, message, body: err });
      }

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
      }
      if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
        throw new NextApiConnectionError({
          status: response.status,
          message: `A NextAPI respondeu com redirecionamento (${response.status}); o SDK não o segue para não reenviar a chave.`,
        });
      }

      const wait = retryAfterMs(response.headers.get('retry-after'));
      if (RETRYABLE.has(response.status) && attempt < retries) {
        await response.body?.cancel();
        await sleep(wait ?? backoffMs(attempt + 1), call.signal);
        continue;
      }
      throw await toError(response, wait);
    }
  }

  /** Não mostra a chave. */
  toJSON() {
    return { baseUrl: this.baseUrl, environment: this.environment };
  }
}

async function toError(response: Response, wait: number | undefined): Promise<NextApiError> {
  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    /* corpo que não é JSON fica como texto */
  }
  const fields = (typeof body === 'object' && body !== null ? body : {}) as { code?: unknown; message?: unknown };
  const code = typeof fields.code === 'number' ? fields.code : undefined;
  const init: NextApiErrorInit = {
    status: response.status,
    code,
    message: typeof fields.message === 'string' && fields.message ? fields.message : `HTTP ${response.status}`,
    body,
    requestId: response.headers.get('x-request-id') ?? undefined,
    retryAfterMs: wait,
  };
  switch (code) {
    case ErrorCodes.TokenNotProvided:
    case ErrorCodes.TokenInvalid:
    case ErrorCodes.SandboxDisabled:
      return new NextApiAuthenticationError(init);
    case ErrorCodes.MissingCredits:
    case ErrorCodes.LiveSearchMissingCredits:
      return new NextApiInsufficientCreditsError(init);
    case ErrorCodes.RequiresPaidPlan:
    case ErrorCodes.LiveSearchNotAllowed:
      return new NextApiPaidPlanRequiredError(init);
  }
  if (response.status === 401 || response.status === 403) return new NextApiAuthenticationError(init);
  if (response.status === 404) return new NextApiNotFoundError(init);
  if (response.status === 429) return new NextApiRateLimitError(init);
  if (response.status >= 500) return new NextApiServerError(init);
  if (response.status === 400 || response.status === 422) return new NextApiValidationError(init);
  return new NextApiError(init);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

/** Atalho: `new NextApi()` é o mesmo que `new NextApiClient()`. */
export const NextApi = NextApiClient;

/** Só caracteres seguros num cabeçalho: CR/LF ou espaço no appInfo quebrariam a requisição. */
export function sanitizeAppInfo(info: string | undefined): string {
  return (info ?? '').replace(/[^A-Za-z0-9._/@+-]/g, '').slice(0, 64);
}

function osName(platform: string): string {
  if (platform === 'win32') return 'windows';
  return platform === 'linux' || platform === 'darwin' ? platform : 'other';
}
