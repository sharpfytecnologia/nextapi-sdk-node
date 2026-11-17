/**
 * SDK oficial da NextAPI para TypeScript e JavaScript.
 * @packageDocumentation
 */
export { NextApiClient, NextApi, VERSION } from './client.js';
export * from './errors.js';
export type * from './types.js';
export { CnpjResource } from './resources/cnpj.js';
export { SociosResource } from './resources/socios.js';
export { CepsResource } from './resources/ceps.js';
export { EmpresasResource } from './resources/empresas.js';
export { CnaesResource, EstadosResource, MunicipiosResource } from './resources/localidades.js';
export { MercadoResource } from './resources/mercado.js';
export { CreditosResource } from './resources/creditos.js';
export { normalizeCnpj, normalizeCep } from './utils.js';
