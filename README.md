# NextAPI para Node.js e TypeScript (`@sharpfy/nextapi`)

SDK oficial da [NextAPI](https://nextapi.com.br) para Node.js 22+: CNPJ (inclusive alfanumérico), Simples Nacional, inscrições estaduais, conformidade, sócios, CEP com busca geográfica, pesquisa de empresas, localidades, mercado e créditos. Sem dependências: usa o `fetch` nativo. Tipos inclusos, ESM e CommonJS.

## Requisitos

- Node.js 22 ou mais recente (testado no 22 e no 26)
- Uma chave de API (veja abaixo)

## Instalação

```bash
npm install @sharpfy/nextapi
```

## Chave de API

Crie a sua em [app.nextapi.com.br](https://app.nextapi.com.br). São dois tipos:

| Prefixo | Ambiente | Custo |
|---|---|---|
| `nxa_test_…` | Sandbox: dados de um subconjunto real, limites próprios e CNPJs de teste que provocam cada erro | Nenhum: nada é debitado |
| `nxa_live_…` | Produção | Créditos do seu plano |

O ambiente sai do prefixo da chave; o endereço da API é o mesmo. Guarde a chave na variável de ambiente
`NEXTAPI_KEY`, que o cliente lê quando você não passa a chave. **Nunca** a coloque no código, no repositório ou num
front-end: quem tem a chave consome os seus créditos.

## Início rápido

```ts
import { NextApiClient } from '@sharpfy/nextapi';

const nextapi = new NextApiClient(); // lê NEXTAPI_KEY

const empresa = await nextapi.cnpj.consultar('11.222.333/0001-81');
console.log(empresa.razaoSocial, empresa.situacaoCadastral);
```

CommonJS: `const { NextApiClient } = require('@sharpfy/nextapi');`

## Configuração

```ts
const nextapi = new NextApiClient({
  apiKey: process.env.NEXTAPI_KEY,          // padrão: NEXTAPI_KEY
  baseUrl: 'https://api.nextapi.com.br',    // só https (http apenas para localhost)
  timeoutMs: 15_000,                        // por tentativa; padrão 30 000
  maxRetries: 3,                            // padrão 2; 0 desliga
  appInfo: 'minha-app/1.4.0',               // identifica a sua aplicação
  // fetch: undiciFetch,                    // fetch próprio (proxy, instrumentação, testes)
});
```

| Opção | Padrão | Efeito |
|---|---|---|
| `apiKey` | `NEXTAPI_KEY` | Chave de API; o prefixo define o ambiente (`nextapi.environment`) |
| `baseUrl` | `https://api.nextapi.com.br` | Endereço da API |
| `timeoutMs` | 30 000 | Tempo limite de cada tentativa, em ms |
| `maxRetries` | 2 | Novas tentativas em falha transitória, só em GET |
| `appInfo` | — | Nome e versão da sua aplicação, nos cabeçalhos |
| `fetch` | `globalThis.fetch` | Implementação de `fetch` |

### Cancelamento

Todo método aceita `signal` (um `AbortSignal`), que interrompe a chamada e as novas tentativas:

```ts
const empresa = await nextapi.cnpj.consultar(cnpj, { signal: AbortSignal.timeout(5_000) });
```

### Express, Fastify, Next.js

Crie o cliente uma vez, no carregamento do módulo, e use em todas as rotas:

<!-- readme-check: ignorar (depende do framework) -->
```ts
// lib/nextapi.ts
export const nextapi = new NextApiClient({ appInfo: 'loja/3.1' });

// app.get('/fornecedores/:cnpj', ...)
res.json(await nextapi.cnpj.consultar(req.params.cnpj));
```

**Não use no navegador:** a chave ficaria visível a qualquer visitante. Chame a NextAPI do seu servidor.

## Exemplos

### CNPJ

```ts
// Cadastro (1 crédito). toleranceDays: idade máxima aceita do dado em cache (0 a 45); 0 força tempo real.
const empresa = await nextapi.cnpj.consultar('11222333000181', { toleranceDays: 30 });
const aoVivo = await nextapi.cnpj.consultarAoVivo('11222333000181'); // tempo real; exige plano que permita

const simples = await nextapi.cnpj.obterSimples('11222333000181');
const ies = await nextapi.cnpj.obterInscricoesEstaduais('11222333000181');
const conformidade = await nextapi.cnpj.obterConformidade('11222333000181'); // sanções e dívida ativa
const alfanumerico = await nextapi.cnpj.consultar('12.ABC.345/01DE-35');
```

### Lotes (até 100 CNPJs)

```ts
const lote = await nextapi.cnpj.consultarLote(['11222333000181', '45997418000153']); // 1 crédito por CNPJ encontrado
const simplesLote = await nextapi.cnpj.obterSimplesLote(['11222333000181']);

// Mais de 100: divida em blocos. Lote nunca é repetido sozinho; decida você numa falha.
for (let i = 0; i < todos.length; i += 100) {
  resultados.push(...(await nextapi.cnpj.consultarLote(todos.slice(i, i + 100))));
}
```

### Sócios e grupo econômico

```ts
const rel = await nextapi.cnpj.obterRelacionamentos('11222333000181', { page: 1, pageSize: 50 });
for (const socio of rel.socios ?? []) {
  // hashSocio só é estável quando vinculoVerificavel é true: não guarde os provisórios.
  const empresas = await nextapi.socios.listarEmpresas(socio.hashSocio!);
}
```

### CEP

```ts
const cep = await nextapi.ceps.consultar('01001-000');
const porRua = await nextapi.ceps.buscar({ uf: 'SP', nomeMunicipio: 'São Paulo', logradouro: 'Paulista' });
const raio = await nextapi.ceps.buscarProximos({ latitude: -23.5505, longitude: -46.6333, raioMetro: 500 });
const vizinhos = await nextapi.ceps.buscarProximosDoCep('01001000', { raioMetro: 1000, pageSize: 100 });
```

### Pesquisa de empresas, com paginação

```ts
for (let page = 1; ; page++) {
  const pagina = await nextapi.empresas.pesquisar({
    uf: 'SP',
    cnaes: '1091101',               // vários: separados por vírgula
    dataAberturaInicio: '2024-01-01',
    page,
    pageSize: 100,
  });
  for (const e of pagina.items) console.log(e.cnpj, e.razaoSocial);
  if (page * pagina.pageSize >= pagina.total) break;
}
```

### Localidades, mercado e créditos

```ts
const estados = await nextapi.estados.listar();
const municipios = await nextapi.municipios.listar({ uf: 'MG', pageSize: 100 });
const bh = await nextapi.municipios.obterPorId(3106200);
const cnaes = await nextapi.cnaes.listar({ page: 1, pageSize: 50 });

const mercado = await nextapi.mercado.obterCnae('1091101', { uf: 'SP', meses: 12 });
const creditos = await nextapi.creditos.consultar();
console.log(`restam ${creditos.totalRemainingCredits} créditos`);
```

## Erros

Toda falha vira uma exceção do SDK; a classe diz o que fazer, e o código detalha.

| Classe | Quando | Status / código | O que fazer |
|---|---|---|---|
| `NextApiAuthenticationError` | Chave ausente, inválida ou revogada | 401 / 1002, 400 / 1001 | Confira a chave e o ambiente |
| `NextApiInsufficientCreditsError` | Créditos do período acabaram | 405 / 1004, 1006 | Aguarde a renovação ou compre créditos avulsos |
| `NextApiPaidPlanRequiredError` | Recurso exige plano pago | 405 / 1012, 1005 | Mude de plano |
| `NextApiNotFoundError` | CNPJ, CEP ou município não existe | 404 / 1000 | Trate como resultado, não como falha |
| `NextApiValidationError` | Entrada recusada pela API ou pelo SDK | 400 / 1007, ou status 0 | Corrija a entrada; não repita |
| `NextApiRateLimitError` | Limite de requisições por minuto | 429 / 1003 | Já repetido sozinho; diminua o ritmo |
| `NextApiServerError` | Falha da API ou do provedor externo | 5xx / 1014, 9999 | 503 é repetido sozinho; persistindo, fale com o suporte |
| `NextApiConnectionError` | Rede, tempo esgotado ou redirecionamento | status 0 | Verifique a conexão; GETs já foram repetidos |

Todas trazem o status HTTP, o código da API, a mensagem, o corpo da resposta e o **request id**. Ao falar com o
suporte, mande o request id: ele localiza a requisição nos nossos logs.

```ts
import {
  NextApiError, NextApiNotFoundError, NextApiInsufficientCreditsError, NextApiRateLimitError,
} from '@sharpfy/nextapi';

try {
  const empresa = await nextapi.cnpj.consultar(cnpj);
} catch (err) {
  if (err instanceof NextApiNotFoundError) return null;
  if (err instanceof NextApiInsufficientCreditsError) alertar(`sem créditos (${err.requestId})`);
  else if (err instanceof NextApiRateLimitError) await esperar(err.retryAfterMs ?? 5_000);
  else if (err instanceof NextApiError) console.error(err.status, err.code, err.message, err.requestId);
  else throw err;
}
```

## Comportamento

**Novas tentativas.** Só requisições `GET` são repetidas, e só em falha transitória: `429`, `502`, `503`, `504` e
erro de rede. O cliente respeita o `Retry-After` da resposta (até 60 s); sem ele, espera de 0,5 s a 8 s, com
crescimento exponencial e variação aleatória. Os lotes (`POST`) **nunca** são repetidos sozinhos, porque consomem
créditos: numa falha, decida você se repete. O padrão é 2 novas tentativas; `maxRetries: 0` desliga.

**Tempo limite.** `timeoutMs` por tentativa (padrão 30 s). Com novas tentativas, o tempo total pode passar disso.

**Validação local.** Entrada que a API recusaria com certeza nem sai do processo: vira
`NextApiValidationError` (status 0) antes da requisição. É o caso de CNPJ com tamanho ou dígitos verificadores errados,
lote vazio ou acima de 100, CEP sem 8 dígitos, raio menor ou igual a zero e latitude ou longitude fora da faixa.
CNPJ e CEP aceitam pontuação (`11.222.333/0001-81`, `01001-000`).

**CNPJ alfanumérico.** O formato novo da Receita (IN RFB 2.229/2024, a partir de julho de 2026) é aceito em todos os
métodos de CNPJ: `12.ABC.345/01DE-35` vira `12ABC34501DE35`, com letras em maiúsculas.

**Segurança.** A chave não aparece em logs, mensagens de erro nem na representação do cliente. O cliente não segue
redirecionamento, para a chave nunca ir para outro host, e só aceita `https` no `baseUrl` (`http` apenas para
`localhost`).

**Cabeçalhos enviados.** Além da autorização, cada requisição leva `User-Agent`, `X-NextApi-Client`
(`typescript/<versão>`) e `X-NextApi-Client-Info` (runtime, sistema e o seu `appInfo`). Servem para o suporte e para
medirmos o uso de cada versão; não carregam dado do seu negócio. O `appInfo` passa por um filtro: só
`A-Za-z0-9._/@+-`, até 64 caracteres.

**Reuso.** Crie um cliente e reutilize: ele não guarda estado entre chamadas e pode ser usado em paralelo (`Promise.all`).

## Sandbox

Com a chave `nxa_test_`, estes CNPJs provocam cada resposta da API, para você testar o tratamento de erro sem
gastar nada:

| CNPJ | Resposta |
|---|---|
| `99999991000125` | 404, não encontrado |
| `99999992000170` | 405 / 1004, sem créditos |
| `99999993000114` | 429 / 1003, limite por minuto |
| `99999994000169` | 503 / 1014, falha do provedor |
| `99999995000103` | sucesso depois de 8 s (consulta lenta) |
| `99999996000158` | 405 / 1012, exige plano pago |
| `99999997000100` | 401 / 1002, chave inválida |

O sandbox tem limite próprio de requisições por minuto e por dia, e os dados vêm de um subconjunto real: um CNPJ ou
CEP pode existir em produção e não no sandbox.

## Testes

Os testes não usam rede: conferem cada método contra o contrato da API, em `contract/cases.json` (rota, parâmetros, corpo, respostas e erros).

```bash
docker run --rm -v "$PWD":/src -w /src node:22 sh -c "npm ci && npm test"
```

Com `NEXTAPI_SMOKE_KEY` definida (e `NEXTAPI_SMOKE_ENV=sandbox` ou `production`), roda também a fumaça contra a API
publicada, com os passos de `contract/smoke.json`.

## Suporte e licença

Dúvidas e problemas: abra uma issue neste repositório ou escreva pelo [app.nextapi.com.br](https://app.nextapi.com.br),
com o request id do erro. Licença MIT.
