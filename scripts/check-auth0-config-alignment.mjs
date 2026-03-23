#!/usr/bin/env node
/**
 * Validates that the Clerk release config is aligned between netlify.toml
 * (frontend build) and render.yaml (backend runtime).
 *
 * The file name is kept for compatibility with the existing package.json script
 * entry, but the check now enforces Clerk-only release config.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const NETLIFY_TOML = path.join(ROOT, 'netlify.toml')
const RENDER_YAML = path.join(ROOT, 'render.yaml')

const readFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return { error: `Missing file: ${filePath}` }
  }
  return { raw: fs.readFileSync(filePath, 'utf8') }
}

const readNetlifyClerkConfig = () => {
  const file = readFile(NETLIFY_TOML)
  if (file.error) {
    return file
  }

  const raw = file.raw
  const lines = raw.split(/\r?\n/)
  let inSection = false
  const out = {}
  const keyRegex = /^\s*(VITE_CLERK_PUBLISHABLE_KEY)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))\s*$/
  for (const line of lines) {
    if (line.startsWith('[')) {
      if (inSection) break
      if (line.includes('context.production.environment')) inSection = true
      continue
    }
    if (!inSection) continue
    const m = line.match(keyRegex)
    if (m) out[m[1]] = (m[2] ?? m[3] ?? m[4] ?? '').trim()
  }

  if (!out.VITE_CLERK_PUBLISHABLE_KEY) {
    return { error: 'Missing in netlify.toml: VITE_CLERK_PUBLISHABLE_KEY' }
  }

  return out
}

const readRenderClerkConfig = () => {
  const file = readFile(RENDER_YAML)
  if (file.error) {
    return file
  }

  const raw = file.raw
  const lines = raw.split(/\r?\n/)
  const out = {}
  let inWebService = false
  let inEnvVars = false
  let depthEnvVars = 0
  let currentKey = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trimStart()
    const indent = line.length - trimmed.length
    if (line.match(/^\s*-\s+type:\s+web\s*$/)) {
      inWebService = true
      inEnvVars = false
      continue
    }
    if (inWebService && line.match(/^\s*envVars:\s*$/)) {
      inEnvVars = true
      depthEnvVars = indent
      continue
    }
    if (inEnvVars && indent <= depthEnvVars && trimmed) break
    if (!inEnvVars) continue
    const keyMatch = line.match(/^\s+-\s+key:\s+(CLERK_(?:SECRET_KEY|JWT_ISSUER|JWKS_URL|PUBLISHABLE_KEY))\s*$/)
    if (keyMatch) {
      currentKey = keyMatch[1]
      continue
    }
    if (currentKey) {
      const syncMatch = line.match(/^\s+sync:\s*(true|false)\s*$/)
      if (syncMatch) {
        if (syncMatch[1] === 'false') {
          out[currentKey] = '__SYNCED_EXTERNALLY__'
        }
        currentKey = null
        continue
      }

      const valueMatch = line.match(/^\s+value:\s*(?:"([^"]*)"|'([^']*)'|(.+?))\s*$/)
      if (valueMatch) {
        const v = (valueMatch[1] ?? valueMatch[2] ?? valueMatch[3] ?? '').trim()
        out[currentKey] = v
        currentKey = null
      }
    }
  }

  for (const key of ['CLERK_SECRET_KEY', 'CLERK_JWT_ISSUER', 'CLERK_JWKS_URL']) {
    if (!out[key]) {
      return { error: `Missing in render.yaml: ${key}` }
    }
  }

  return out
}

const normalizeUrl = (value) => {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim().toLowerCase().replace(/\/+$/, '')
  try {
    return new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`).toString().replace(/\/+$/, '')
  } catch {
    return trimmed.replace(/^https?:\/\//, '')
  }
}

function main() {
  const netlify = readNetlifyClerkConfig()
  if (netlify.error) {
    console.error('[check-clerk-config]', netlify.error)
    process.exit(1)
  }

  const render = readRenderClerkConfig()
  if (render.error) {
    console.error('[check-clerk-config]', render.error)
    process.exit(1)
  }

  const mismatches = []

  const frontendKey = netlify.VITE_CLERK_PUBLISHABLE_KEY
  const mirroredKey = render.CLERK_PUBLISHABLE_KEY
  if (mirroredKey && frontendKey !== mirroredKey) {
    mismatches.push({
      key: 'CLERK_PUBLISHABLE_KEY',
      frontend: frontendKey,
      backend: mirroredKey,
    })
  }

  if (!normalizeUrl(render.CLERK_JWT_ISSUER)) {
    mismatches.push({
      key: 'CLERK_JWT_ISSUER',
      frontend: '(expected issuer URL)',
      backend: render.CLERK_JWT_ISSUER,
    })
  }

  if (!normalizeUrl(render.CLERK_JWKS_URL)) {
    mismatches.push({
      key: 'CLERK_JWKS_URL',
      frontend: '(expected JWKS URL)',
      backend: render.CLERK_JWKS_URL,
    })
  }

  if (mismatches.length) {
    console.error('[check-clerk-config] Clerk config is not aligned between netlify.toml and render.yaml.')
    for (const mismatch of mismatches) {
      console.error(`  ${mismatch.key}`)
      console.error(`    frontend: ${mismatch.frontend}`)
      console.error(`    backend:  ${mismatch.backend}`)
    }
    process.exit(1)
  }

  console.log('Clerk release config validated between netlify.toml and render.yaml.')
  process.exit(0)
}

main()
