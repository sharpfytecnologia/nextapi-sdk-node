import { NextApiValidationError } from './errors.js';

const CNPJ = /^[0-9A-Z]{12}[0-9]{2}$/;
const HASH_SOCIO = /^[0-9a-fA-F]{20}$/;
const SEGMENT = /^[0-9A-Za-z_-]+$/;

function invalid(message: string): never {
  throw new NextApiValidationError({ status: 0, message });
}

/**
 * Normaliza o CNPJ: tira pontuação e espaços e põe em maiúsculas. Aceita o CNPJ alfanumérico
 * (12 caracteres alfanuméricos e 2 dígitos verificadores), que a Receita emite desde julho de 2026.
 */
export function normalizeCnpj(cnpj: string): string {
  const value = String(cnpj ?? '').replace(/[\s./-]/g, '').toUpperCase();
  if (!CNPJ.test(value)) invalid(`CNPJ inválido: "${cnpj}". Informe 14 caracteres, com ou sem pontuação.`);
  return value;
}

/** Normaliza o CEP para 8 dígitos (aceita "01001-000"). */
export function normalizeCep(cep: string): string {
  const value = String(cep ?? '').replace(/[\s.-]/g, '');
  if (!/^\d{8}$/.test(value)) invalid(`CEP inválido: "${cep}". Informe 8 dígitos.`);
  return value;
}

/** hashSocio: 20 caracteres hexadecimais, como vem de `socios[].hashSocio`. */
export function normalizeHashSocio(hash: string): string {
  const value = String(hash ?? '').trim();
  if (!HASH_SOCIO.test(value)) invalid('hashSocio inválido: são 20 caracteres hexadecimais.');
  return value.toLowerCase();
}

/** Segmento de caminho livre (ex.: tipo do indicador): só letras, dígitos, "_" e "-". */
export function pathSegment(value: string | number, name: string): string {
  const text = String(value ?? '').trim();
  if (!SEGMENT.test(text)) invalid(`${name} inválido: "${value}".`);
  return encodeURIComponent(text);
}

/** Inteiro positivo para caminho (ex.: id do município). */
export function positiveInt(value: number, name: string): string {
  if (!Number.isInteger(value) || value <= 0) invalid(`${name} inválido: "${value}".`);
  return String(value);
}

export function requirePositive(value: number | undefined, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) invalid(`${name} tem de ser maior que zero.`);
}

export function requireRange(value: number | undefined, min: number, max: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    invalid(`${name} tem de estar entre ${min} e ${max}.`);
}

export function batch(cnpjs: readonly string[]): string[] {
  if (!Array.isArray(cnpjs) || cnpjs.length === 0) invalid('Informe ao menos um CNPJ.');
  if (cnpjs.length > 100) invalid(`O lote aceita até 100 CNPJs; vieram ${cnpjs.length}.`);
  return cnpjs.map(normalizeCnpj);
}

/** Query string sem os valores ausentes, na ordem informada. */
export function query(params?: object): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, value instanceof Date ? value.toISOString().slice(0, 10) : String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

/** Espera de `attempt` (1, 2, …): exponencial com jitter, limitada a 8 s. */
export function backoffMs(attempt: number): number {
  const base = Math.min(8000, 500 * 2 ** (attempt - 1));
  return base / 2 + Math.random() * (base / 2);
}

/** `Retry-After` em segundos ou data HTTP; limitado a 60 s. */
export function retryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
  return Number.isFinite(ms) && ms >= 0 ? Math.min(ms, 60_000) : undefined;
}
