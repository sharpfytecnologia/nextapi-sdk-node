/**
 * Contrato compartilhado pelos seis SDKs (sdks/contract/cases.json): a mesma chamada tem de montar a mesma
 * requisição, os erros da API viram as mesmas classes, e entrada inválida não sai do processo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

/** Contrato em sdks/contract (monorepo) ou em contract/ dentro do SDK (espelho público). */
const contractFile = (name: string) => {
  const local = new URL(`../../contract/${name}`, import.meta.url);
  return existsSync(local) ? local : new URL(`../../../contract/${name}`, import.meta.url);
};
import {
  NextApiClient,
  NextApiAuthenticationError,
  NextApiConnectionError,
  NextApiInsufficientCreditsError,
  NextApiNotFoundError,
  NextApiPaidPlanRequiredError,
  NextApiRateLimitError,
  NextApiServerError,
  NextApiValidationError,
} from '../src/index.js';

interface Case {
  id: string;
  call?: string;
  args: unknown[];
  method: string;
  path: string;
  query: Record<string, string>;
  body?: unknown;
  response: unknown;
}
interface ErrorCase {
  status: number;
  body: { code: number; message: string };
  error: string;
  retryable?: boolean;
}
// Compilado em dist-test/tests: sobe até sdks/ e entra em contract/.
const contract = JSON.parse(readFileSync(contractFile('cases.json'), 'utf8')) as {
  cases: Case[];
  errors: ErrorCase[];
  invalid: { call: string; args: unknown[]; reason: string }[];
  valid: { call: string; args: unknown[]; path: string }[];
  headers: { client: string; info: string; appInfo: { input: string; sanitized: string } };
};

interface Seen {
  url: URL;
  init: RequestInit;
}

function fake(responses: (() => Response)[] | (() => Response)) {
  const seen: Seen[] = [];
  const queue = Array.isArray(responses) ? [...responses] : null;
  const fetchImpl = (async (input: string | URL, init: RequestInit = {}) => {
    seen.push({ url: new URL(String(input)), init });
    const make = queue ? queue.shift() : (responses as () => Response);
    if (!make) throw new Error('requisição a mais');
    return make();
  }) as typeof fetch;
  return { seen, fetchImpl };
}

const json =
  (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

const KEY = 'nxa_test_0123456789abcdef';

/** Requisição que só termina quando cancelada; o intervalo segura o event loop como um socket aberto seguraria. */
function hang(init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const alive = setInterval(() => {}, 1000);
    init.signal!.addEventListener('abort', () => {
      clearInterval(alive);
      reject(init.signal!.reason);
    });
  });
}
const client = (fetchImpl: typeof fetch, extra: object = {}) =>
  new NextApiClient({ apiKey: KEY, fetch: fetchImpl, maxRetries: 2, ...extra });

type AnyResource = Record<string, (...args: unknown[]) => Promise<unknown>>;

/** Chama `recurso.método` com os argumentos do caso. */
function invoke(api: NextApiClient, call: string, args: unknown[]): Promise<unknown> {
  const [resource, method] = call.split('.');
  const target = (api as unknown as Record<string, AnyResource>)[resource];
  assert.ok(target && typeof target[method] === 'function', `SDK sem ${call}`);
  return target[method](...args);
}

for (const c of contract.cases) {
  test(`contrato: ${c.id}`, async () => {
    const { seen, fetchImpl } = fake(json(c.response));
    const result = await invoke(client(fetchImpl), c.call ?? c.id, c.args);
    assert.equal(seen.length, 1);
    const { url, init } = seen[0];
    assert.equal(init.method, c.method);
    assert.equal(url.origin, 'https://api.nextapi.com.br');
    assert.equal(url.pathname, c.path);
    assert.deepEqual(Object.fromEntries(url.searchParams), c.query);
    const headers = init.headers as Record<string, string>;
    assert.equal(headers.Authorization, `Bearer ${KEY}`);
    assert.match(headers['User-Agent'], /^nextapi-typescript\/\d+\.\d+\.\d+ /);
    assert.match(headers['X-NextApi-Client'], new RegExp(contract.headers.client));
    assert.match(headers['X-NextApi-Client-Info'], new RegExp(contract.headers.info));
    assert.equal(init.redirect, 'manual');
    if (c.body !== undefined) {
      assert.equal(headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(String(init.body)), c.body);
    } else {
      assert.equal(init.body, undefined);
    }
    assert.deepEqual(result, c.response);
  });
}

test('contrato: todo caso de cases.json tem método no SDK', () => {
  const api = client(fake(json({})).fetchImpl) as unknown as Record<string, AnyResource>;
  for (const call of [...contract.cases.map((x) => x.call ?? x.id), ...contract.invalid.map((x) => x.call)]) {
    const [resource, method] = call.split('.');
    assert.equal(typeof api[resource]?.[method], 'function', call);
  }
});

for (const inv of contract.invalid) {
  test(`entrada inválida não chega à API: ${inv.call} (${inv.reason})`, async () => {
    const { seen, fetchImpl } = fake(json({}));
    await assert.rejects(() => invoke(client(fetchImpl), inv.call, inv.args), NextApiValidationError);
    assert.equal(seen.length, 0);
  });
}

for (const v of contract.valid) {
  test(`entrada aceita: ${v.call} ${JSON.stringify(v.args)}`, async () => {
    const { seen, fetchImpl } = fake(json({}));
    await invoke(client(fetchImpl), v.call, v.args);
    assert.equal(seen[0].url.pathname, v.path);
  });
}

const classes: Record<string, abstract new (...args: never[]) => Error> = {
  authentication: NextApiAuthenticationError,
  insufficientCredits: NextApiInsufficientCreditsError,
  paidPlanRequired: NextApiPaidPlanRequiredError,
  notFound: NextApiNotFoundError,
  validation: NextApiValidationError,
  rateLimit: NextApiRateLimitError,
  server: NextApiServerError,
};

for (const e of contract.errors) {
  test(`erro ${e.status}/${e.body.code} vira ${e.error}`, async () => {
    const { seen, fetchImpl } = fake(json(e.body, e.status, { 'x-request-id': 'req-1', 'retry-after': '0' }));
    const err = await invoke(client(fetchImpl), 'cnpj.consultar', ['11222333000181']).catch((x: unknown) => x);
    assert.ok(err instanceof classes[e.error], `${(err as Error)?.constructor?.name} não é ${e.error}`);
    const apiErr = err as InstanceType<typeof NextApiServerError>;
    assert.equal(apiErr.status, e.status);
    assert.equal(apiErr.code, e.body.code);
    assert.equal(apiErr.message, e.body.message);
    assert.equal(apiErr.requestId, 'req-1');
    assert.equal(seen.length, e.retryable ? 3 : 1, 'tentativas');
  });
}

test('retry: 503 e depois 200 devolve o 200, respeitando Retry-After', async () => {
  const { seen, fetchImpl } = fake([json({}, 503, { 'retry-after': '0' }), json({ cnpj: '1' })]);
  assert.deepEqual(await client(fetchImpl).cnpj.consultar('11222333000181'), { cnpj: '1' });
  assert.equal(seen.length, 2);
});

test('retry: POST de lote nunca é repetido (consome créditos)', async () => {
  const { seen, fetchImpl } = fake(json({ code: 1014, message: 'x' }, 503, { 'retry-after': '0' }));
  await assert.rejects(() => client(fetchImpl).cnpj.consultarLote(['11222333000181']), NextApiServerError);
  assert.equal(seen.length, 1);
});

test('retry: falha de rede é repetida e depois vira NextApiConnectionError sem a chave na mensagem', async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    throw new TypeError('fetch failed');
  }) as typeof fetch;
  const err = (await client(fetchImpl, { maxRetries: 1 }).creditos.consultar().catch((x: unknown) => x)) as Error;
  assert.ok(err instanceof NextApiConnectionError);
  assert.equal(calls, 2);
  assert.ok(!err.message.includes(KEY));
});

test('redirecionamento não é seguido e vira erro', async () => {
  const { seen, fetchImpl } = fake(() => new Response(null, { status: 302, headers: { location: 'https://evil.example/' } }));
  await assert.rejects(() => client(fetchImpl).creditos.consultar(), NextApiConnectionError);
  assert.equal(seen.length, 1);
});

test('tempo esgotado vira NextApiConnectionError', async () => {
  const fetchImpl = ((_: unknown, init: RequestInit) => hang(init)) as typeof fetch;
  const err = (await client(fetchImpl, { timeoutMs: 20, maxRetries: 0 }).creditos.consultar().catch((x: unknown) => x)) as Error;
  assert.ok(err instanceof NextApiConnectionError);
  assert.match(err.message, /20 ms/);
});

test('cancelamento pelo chamador interrompe sem novas tentativas', async () => {
  const controller = new AbortController();
  let calls = 0;
  const fetchImpl = ((_: unknown, init: RequestInit) => {
    calls++;
    return hang(init);
  }) as typeof fetch;
  const pending = client(fetchImpl).creditos.consultar({ signal: controller.signal });
  controller.abort(new Error('cancelado'));
  await assert.rejects(pending, /cancelado/);
  assert.equal(calls, 1);
});

test('a chave não aparece no objeto do cliente', () => {
  const api = client(fake(json({})).fetchImpl);
  assert.ok(!JSON.stringify(api).includes(KEY));
  assert.ok(!Object.values(api).some((v) => v === KEY));
  assert.equal(api.environment, 'sandbox');
});

test('baseUrl sem https é recusada (exceto localhost)', () => {
  assert.throws(() => new NextApiClient({ apiKey: KEY, baseUrl: 'http://api.nextapi.com.br' }), /https/);
  assert.doesNotThrow(() => new NextApiClient({ apiKey: KEY, baseUrl: 'http://localhost:5112' }));
});

test('sem chave: erro claro; NEXTAPI_KEY é lida do ambiente', () => {
  const saved = process.env.NEXTAPI_KEY;
  delete process.env.NEXTAPI_KEY;
  assert.throws(() => new NextApiClient(), NextApiAuthenticationError);
  process.env.NEXTAPI_KEY = 'nxa_live_abc';
  assert.equal(new NextApiClient().environment, 'production');
  if (saved === undefined) delete process.env.NEXTAPI_KEY;
  else process.env.NEXTAPI_KEY = saved;
});

test('corpo de erro que não é JSON ainda vira erro tipado', async () => {
  const { fetchImpl } = fake(() => new Response('<html>Bad Gateway</html>', { status: 500 }));
  const err = (await client(fetchImpl, { maxRetries: 0 }).creditos.consultar().catch((x: unknown) => x)) as InstanceType<
    typeof NextApiServerError
  >;
  assert.ok(err instanceof NextApiServerError);
  assert.equal(err.message, 'HTTP 500');
  assert.equal(err.body, '<html>Bad Gateway</html>');
});

// ---- Fumaça contra a API publicada (sdks/smoke.sh): só roda com NEXTAPI_SMOKE_KEY. ----
const smokeKey = process.env.NEXTAPI_SMOKE_KEY;
const smokeEnv = process.env.NEXTAPI_SMOKE_ENV ?? 'production';
const smoke = JSON.parse(readFileSync(contractFile('smoke.json'), 'utf8')) as {
  steps: { id: string; call: string; args: unknown[]; expect: string[]; env?: string; badKey?: boolean }[];
};

function classify(err: unknown): string {
  if (err === undefined) return 'ok';
  if (err instanceof NextApiConnectionError) return 'connection';
  for (const [name, cls] of Object.entries(classes)) if (err instanceof cls) return name;
  return 'other';
}

for (const step of smoke.steps) {
  test(`smoke ${smokeEnv}: ${step.id}`, { skip: !smokeKey || (step.env !== undefined && step.env !== smokeEnv) }, async () => {
    const api = new NextApiClient({ apiKey: step.badKey ? `${smokeKey!.slice(0, 9)}chave-invalida` : smokeKey!, maxRetries: 4 });
    const err = await invoke(api, step.call, step.args).then(() => undefined, (e: unknown) => e);
    const got = classify(err);
    const e = err as InstanceType<typeof NextApiServerError> | undefined;
    console.log(`SMOKE typescript ${smokeEnv} ${step.id}: ${got}${e ? ` (${e.status}/${e.code ?? '-'} ${e.message}${e.requestId ? ` req=${e.requestId}` : ''})` : ''}`);
    assert.ok(step.expect.includes(got), `${step.id}: veio ${got}, esperado ${step.expect.join('|')}`);
  });
}

test('appInfo é filtrado antes de entrar nos cabeçalhos', async () => {
  const { seen, fetchImpl } = fake(json({}));
  const { input, sanitized } = contract.headers.appInfo;
  await client(fetchImpl, { appInfo: input }).creditos.consultar();
  const headers = seen[0].init.headers as Record<string, string>;
  assert.ok(headers['User-Agent'].endsWith(` ${sanitized}`));
  assert.ok(headers['X-NextApi-Client-Info'].endsWith(`; ${sanitized}`));
  assert.match(headers['X-NextApi-Client-Info'], new RegExp(contract.headers.info));
});
