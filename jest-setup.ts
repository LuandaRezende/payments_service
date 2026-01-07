// 1. Defina a variável de ambiente ANTES de qualquer import
process.env.TEMPORAL_LOG_LEVEL = 'ERROR';

import { Runtime, DefaultLogger } from '@temporalio/worker';

// 2. Silencia o SDK (Logs de Atividade/Worker)
try {
  Runtime.install({ logger: new DefaultLogger('ERROR') });
} catch (e) {}

// 3. Silencia o console (Logs do NestJS e console.log)
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});