import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const scriptPath = fileURLToPath(new URL('./validate-prod-env.mjs', import.meta.url))
const cleanEnv = {
  ...process.env,
  ENFORCE_PROD_ENV: '1',
}

for (const key of [
  'VITE_API_URL',
  'VITE_AUTH_MODE',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_MODE',
  'VITE_BUILD_MODE',
]) {
  delete cleanEnv[key]
}

const writeBaseEnv = (cwd) => {
  writeFileSync(
    path.join(cwd, '.env'),
    [
      'VITE_API_URL=https://project-ref.supabase.co/functions/v1/platform-api',
      'VITE_AUTH_MODE=supabase',
      'VITE_SUPABASE_URL=https://project-ref.supabase.co',
      'VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test',
      '',
    ].join('\n')
  )
}

const runValidator = (cwd, env = {}) =>
  spawnSync(process.execPath, [scriptPath], {
    cwd,
    env: {
      ...cleanEnv,
      ...env,
    },
    encoding: 'utf8',
  })

const withTempProject = (callback) => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'validate-prod-env-'))
  try {
    writeBaseEnv(cwd)
    return callback(cwd)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

test('production validation sees .env.local the same way Vite build does', () => {
  withTempProject((cwd) => {
    writeFileSync(path.join(cwd, '.env.local'), 'VITE_API_URL=http://localhost:5001\n')

    const result = runValidator(cwd)

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /VITE_API_URL cannot point to localhost in production/)
  })
})

test('explicit production environment values override local dotenv files', () => {
  withTempProject((cwd) => {
    writeFileSync(path.join(cwd, '.env.local'), 'VITE_API_URL=http://localhost:5001\n')

    const result = runValidator(cwd, {
      VITE_API_URL: 'https://project-ref.supabase.co/functions/v1/platform-api',
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Production environment validation passed/)
  })
})

test('production validation rejects same-origin frontend API values', () => {
  withTempProject((cwd) => {
    const result = runValidator(cwd, {
      VITE_API_URL: 'https://litmusai.netlify.app',
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /must point directly to the Supabase Edge Function URL/)
  })
})

test('production validation requires the API and auth project refs to match', () => {
  withTempProject((cwd) => {
    const result = runValidator(cwd, {
      VITE_API_URL: 'https://api-project.supabase.co/functions/v1/platform-api',
      VITE_SUPABASE_URL: 'https://auth-project.supabase.co',
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /same Supabase project origin/)
  })
})
