// React checks process.env.NODE_ENV; Workers have no `process` unless nodejs_compat is on.
if (typeof globalThis.process === 'undefined') globalThis.process = { env: { NODE_ENV: 'production' } }
else if (!globalThis.process.env) globalThis.process.env = { NODE_ENV: 'production' }
else if (!globalThis.process.env.NODE_ENV) globalThis.process.env.NODE_ENV = 'production'
