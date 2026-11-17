/**
 * Erros do SDK. Toda falha da API vira um {@link NextApiError}; a subclasse diz o que fazer.
 * O código numérico da API (`code`) é o que distingue casos com o mesmo status HTTP
 * (405 tanto para "sem créditos" quanto para "plano pago obrigatório").
 */

/** Códigos de erro devolvidos pela NextAPI no corpo `{ status, code, message }`. */
export const ErrorCodes = {
  NotFound: 1000,
  TokenNotProvided: 1001,
  TokenInvalid: 1002,
  TooManyRequests: 1003,
  MissingCredits: 1004,
  LiveSearchNotAllowed: 1005,
  LiveSearchMissingCredits: 1006,
  InvalidCep: 1007,
  RequiresPaidPlan: 1012,
  ExternalProviderFailure: 1014,
  SandboxDailyLimit: 1015,
  SandboxDisabled: 1016,
} as const;

export interface NextApiErrorInit {
  status: number;
  code?: number;
  message: string;
  body?: unknown;
  requestId?: string;
  retryAfterMs?: number;
}

export class NextApiError extends Error {
  /** Status HTTP (0 quando a requisição nem chegou à API). */
  readonly status: number;
  /** Código de erro da NextAPI (ver {@link ErrorCodes}), quando a API o informou. */
  readonly code?: number;
  /** Corpo da resposta de erro, já interpretado como JSON quando possível. */
  readonly body?: unknown;
  /** Identificador da requisição (cabeçalho `x-request-id`), para o suporte. */
  readonly requestId?: string;

  constructor(init: NextApiErrorInit) {
    super(init.message);
    this.name = new.target.name;
    this.status = init.status;
    this.code = init.code;
    this.body = init.body;
    this.requestId = init.requestId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Chave ausente, inválida ou revogada (401; 400 com código 1001). */
export class NextApiAuthenticationError extends NextApiError {}
/** Sem créditos para a consulta (códigos 1004 e 1006). */
export class NextApiInsufficientCreditsError extends NextApiError {}
/** O recurso exige plano pago ou créditos avulsos (códigos 1012 e 1005). */
export class NextApiPaidPlanRequiredError extends NextApiError {}
/** O CNPJ, CEP ou sócio pesquisado não existe (404). */
export class NextApiNotFoundError extends NextApiError {}
/** Parâmetro rejeitado pela API (400) ou pelo próprio SDK antes de enviar (status 0). */
export class NextApiValidationError extends NextApiError {}
/** Limite de requisições do plano ou do sandbox (429). */
export class NextApiRateLimitError extends NextApiError {
  /** Quanto esperar antes de tentar de novo, pelo cabeçalho `Retry-After`. */
  readonly retryAfterMs?: number;
  constructor(init: NextApiErrorInit) {
    super(init);
    this.retryAfterMs = init.retryAfterMs;
  }
}
/** Falha do lado da API (5xx), inclusive a do provedor em tempo real (1014). */
export class NextApiServerError extends NextApiError {}
/** Não houve resposta: rede, DNS, TLS, tempo esgotado ou redirecionamento recusado. */
export class NextApiConnectionError extends NextApiError {}
