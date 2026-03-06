#!/usr/bin/env node
/**
 * Verifies that Auth0-related config is aligned between netlify.toml (frontend)
 * and render.yaml (backend). Exits 0 if aligned, 1 if misaligned or missing.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const NETLIFY_TOML = path.join(ROOT, 'netlify.toml')
const RENDER_YAML = path.join(ROOT, 'render.yaml')

const VITE_KEYS = [
  'VITE_AUTH0_DOMAIN',
  'VITE_AUTH0_CLIENT_ID',
  'VITE_AUTH0_AUDIENCE',
  'VITE_AUTH0_REDIRECT_URI',
]
const AUTH0_KEYS = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_AUDIENCE', 'AUTH0_REDIRECT_URI']

function readNetlifyAuth0() {
  if (!fs.existsSync(NETLIFY_TOML)) {
    return { error: `Missing file: ${NETLIFY_TOML}` }
  }
  const raw = fs.readFileSync(NETLIFY_TOML, 'utf8')
  const lines = raw.split(/\r?\n/)
  let inSection = false
  const out = {}
  const keyRegex = /^\s*(VITE_AUTH0_(?:DOMAIN|CLIENT_ID|AUDIENCE|REDIRECT_URI))\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))\s*$/
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
  for (const k of VITE_KEYS) {
    if (out[k] === undefined) return { error: `Missing in netlify.toml: ${k}` }
  }
  return out
}

function readRenderAuth0() {
  if (!fs.existsSync(RENDER_YAML)) {
    return { error: `Missing file: ${RENDER_YAML}` }
  }
  const raw = fs.readFileSync(RENDER_YAML, 'utf8')
  const lines = raw.split(/\r?\n/)
  let inWebService = false
  let inEnvVars = false
  let depthEnvVars = 0
  const out = {}
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
    const keyMatch = line.match(/^\s+-\s+key:\s+(AUTH0_(?:DOMAIN|CLIENT_ID|AUDIENCE|REDIRECT_URI))\s*$/)
    if (keyMatch) {
      currentKey = keyMatch[1]
      continue
    }
    if (currentKey) {
      const valueMatch = line.match(/^\s+value:\s*(?:"([^"]*)"|'([^']*)'|(.+?))\s*$/)
      if (valueMatch) {
        const v = (valueMatch[1] ?? valueMatch[2] ?? valueMatch[3] ?? '').trim()
        out[currentKey] = v
        currentKey = null
      }
    }
  }
  for (const k of AUTH0_KEYS) {
    if (out[k] === undefined) return { error: `Missing in render.yaml: ${k}` }
  }
  return out
}

function normalizeDomain(v) {
  if (!v || typeof v !== 'string') return ''
  let s = v.trim().toLowerCase().replace(/\/+$/, '')
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`)
    return u.hostname
  } catch {
    return s.replace(/^https?:\/\//, '')
  }
}

function main() {
  const netlify = readNetlifyAuth0()
  if (netlify.error) {
    console.error('[check-auth0-config]', netlify.error)
    process.exit(1)
  }
  const render = readRenderAuth0()
  if (render.error) {
    console.error('[check-auth0-config]', render.error)
    process.exit(1)
  }

  const pairs = [
    ['VITE_AUTH0_CLIENT_ID', 'AUTH0_CLIENT_ID'],
    ['VITE_AUTH0_AUDIENCE', 'AUTH0_AUDIENCE'],
    ['VITE_AUTH0_REDIRECT_URI', 'AUTH0_REDIRECT_URI'],
  ]
  const mismatches = []
  for (const [viteKey, auth0Key] of pairs) {
    const a = netlify[viteKey]
    const b = render[auth0Key]
    if (a !== b) {
      mismatches.push({ viteKey, auth0Key, frontend: a, backend: b })
    }
  }
  const netlifyDomain = normalizeDomain(netlify.VITE_AUTH0_DOMAIN)
  const renderDomain = normalizeDomain(render.AUTH0_DOMAIN)
  if (netlifyDomain !== renderDomain) {
    mismatches.push({
      viteKey: 'VITE_AUTH0_DOMAIN',
      auth0Key: 'AUTH0_DOMAIN',
      frontend: netlify.VITE_AUTH0_DOMAIN,
      backend: render.AUTH0_DOMAIN,
      note: '(normalized domain must match)',
    })
  }

  if (mismatches.length) {
    console.error('[check-auth0-config] Auth0 config is not aligned between netlify.toml and render.yaml.')
    for (const m of mismatches) {
      console.error(`  ${m.viteKey} (netlify) !== ${m.auth0Key} (render)`)
      console.error(`    frontend: ${m.frontend}`)
      console.error(`    backend:  ${m.backend}`)
      if (m.note) console.error(`    ${m.note}`)
    }
    process.exit(1)
  }

  console.log('Auth0 config aligned between netlify.toml and render.yaml.')
  process.exit(0)
}

main()
