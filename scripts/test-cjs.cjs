// O pacote CommonJS carrega e funciona com require().
const assert = require('node:assert/strict');
const { NextApiClient, NextApi, NextApiValidationError, normalizeCnpj } = require('../dist/index.cjs');
assert.equal(NextApi, NextApiClient);
assert.equal(normalizeCnpj('12.abc.345/01de-35'), '12ABC34501DE35');
assert.throws(() => normalizeCnpj('123'), NextApiValidationError);
assert.equal(new NextApiClient({ apiKey: 'nxa_test_x' }).environment, 'sandbox');
console.log('CommonJS ok');
