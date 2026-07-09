#!/usr/bin/env node
/**
 * Supabase Auth URL 설정 (Management API)
 *
 * 1. https://supabase.com/dashboard/account/tokens 에서 Access Token 발급
 * 2. PowerShell: $env:SUPABASE_ACCESS_TOKEN="sbp_..."
 * 3. node scripts/configure-supabase-auth.mjs
 *
 * 또는: npx supabase login 후 ~/.supabase/access-token 자동 사용
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PROJECT_REF = 'jakbjzgdewraeilerwuh'
const SITE_URL = 'https://yeodongsikdang.vercel.app'
const REDIRECT_URLS = [
  'https://yeodongsikdang.vercel.app/**',
  'https://yeodongsikdang.vercel.app/account',
  'https://*-yeowon-s-projects.vercel.app/**',
  'http://localhost:5173/**',
  'http://localhost:5173/account',
]

function readToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim()
  const tokenPath = path.join(os.homedir(), '.supabase', 'access-token')
  if (fs.existsSync(tokenPath)) return fs.readFileSync(tokenPath, 'utf8').trim()
  return null
}

function mergeRedirectList(current) {
  const existing = (current || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const merged = [...new Set([...existing, ...REDIRECT_URLS])]
  return merged.join(',')
}

async function main() {
  const token = readToken()
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN이 없습니다.')
    console.error('Supabase 대시보드 → Account → Access Tokens 에서 발급 후:')
    console.error('  $env:SUPABASE_ACCESS_TOKEN="sbp_..."')
    console.error('  node scripts/configure-supabase-auth.mjs')
    process.exit(1)
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const getRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    headers,
  })
  if (!getRes.ok) {
    console.error('Auth config 조회 실패:', getRes.status, await getRes.text())
    process.exit(1)
  }

  const current = await getRes.json()
  const patchBody = {
    site_url: SITE_URL,
    uri_allow_list: mergeRedirectList(current.uri_allow_list),
  }

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patchBody),
  })

  if (!patchRes.ok) {
    console.error('Auth config 업데이트 실패:', patchRes.status, await patchRes.text())
    process.exit(1)
  }

  const updated = await patchRes.json()
  console.log('Supabase Auth URL 설정 완료')
  console.log('  site_url:', updated.site_url || SITE_URL)
  console.log('  uri_allow_list:', updated.uri_allow_list || patchBody.uri_allow_list)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
