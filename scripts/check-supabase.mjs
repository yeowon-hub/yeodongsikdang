#!/usr/bin/env node
import fs from 'node:fs'

function loadEnv() {
  const envPath = '.env'
  if (!fs.existsSync(envPath)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const i = line.indexOf('=')
        return [line.slice(0, i), line.slice(i + 1)]
      }),
  )
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ .env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY가 필요합니다.')
  process.exit(1)
}

const headers = { apikey: key, Authorization: `Bearer ${key}` }

async function check(label, path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const ok = res.ok
  console.log(`${ok ? '✅' : '❌'} ${label} (${res.status})`)
  return ok
}

console.log(`Supabase project: ${url}\n`)

let ok = true
ok &&= await check('Auth API', '/auth/v1/health')
ok &&= await check('ingredients 테이블', '/rest/v1/ingredients?select=id&limit=1')
ok &&= await check('recipes 테이블', '/rest/v1/recipes?select=id&limit=1')
ok &&= await check('get_my_household RPC', '/rest/v1/rpc/get_my_household', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
})

if (env.VITE_SITE_URL) {
  console.log(`\nVITE_SITE_URL: ${env.VITE_SITE_URL}`)
} else {
  console.log('\n⚠️  VITE_SITE_URL 없음 — OAuth/이메일 확인 리다이렉트는 현재 접속 도메인 사용')
}

process.exit(ok ? 0 : 1)
