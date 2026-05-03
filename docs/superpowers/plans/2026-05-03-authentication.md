# Email/Password Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password authentication to the food diary app using Supabase Auth, with Row Level Security (RLS) for data isolation between users.

**Architecture:** Use Supabase Auth for user authentication, Supabase Row Level Security for data isolation, and Next.js middleware for route protection. Authentication state is managed by Supabase client libraries.

**Tech Stack:** Next.js 16, Supabase Auth, @supabase/auth-helpers-nextjs, TypeScript, Tailwind CSS

---

## File Structure

This plan creates/ modifies the following files:

**New files:**
- `app/auth/login/page.tsx` - Login page
- `app/auth/signup/page.tsx` - Signup page
- `app/middleware.ts` - Route protection middleware
- `components/auth/LoginForm.tsx` - Login form component
- `components/auth/SignupForm.tsx` - Signup form component
- `components/layout/Navbar.tsx` - Navigation bar with user info
- `components/auth/AuthProvider.tsx` - Auth context provider

**Modified files:**
- `app/layout.tsx` - Wrap with AuthProvider
- `app/page.tsx` - Add Navbar and authentication check
- `lib/supabase/client.ts` - Update auth configuration
- `.env.local.example` - Add Supabase environment variables

**Database migrations:**
- `supabase/migrations/xxx_add_user_id_to_diet_logs.sql` - Add user_id column and RLS

---

### Task 1: Add Supabase Environment Variables to Example File

**Files:**
- Modify: `.env.local.example`

- [ ] **Step 1: Add Supabase environment variables to .env.local.example**

```env
# Zhipu AI API
ZHIPU_API_KEY=your_zhipu_api_key

# Vercel KV (optional - for Vercel deployment)
# KV_REST_API_URL=your-kv-id.kv.vercel-storage.com
# KV_REST_API_TOKEN=your-kv-api-token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 2: Commit**

```bash
git add .env.local.example
git commit -m "feat: add Supabase environment variables to example file"
```

---

### Task 2: Create Database Migration for User Isolation

**Files:**
- Create: `supabase/migrations/20260503_add_user_id_to_diet_logs.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add user_id column to diet_logs table
ALTER TABLE diet_logs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_diet_logs_user_id ON diet_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_logs_user_date ON diet_logs(user_id, date);

-- Enable Row Level Security
ALTER TABLE diet_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own logs" ON diet_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON diet_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON diet_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON diet_logs;

-- Create policies for data isolation
CREATE POLICY "Users can view own logs"
ON diet_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
ON diet_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
ON diet_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
ON diet_logs FOR DELETE
USING (auth.uid() = user_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260503_add_user_id_to_diet_logs.sql
git commit -m "feat: add user_id column and RLS to diet_logs table"
```

---

### Task 3: Update Supabase Client for Auth

**Files:**
- Modify: `lib/supabase/client.ts`

- [ ] **Step 1: Update client.ts with better auth configuration**

```typescript
'use client'

import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

let client: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

export function useSupabaseClient() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient())
  }, [])

  return supabase
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase/client.ts
git commit -m "refactor: update Supabase client for auth support"
```

---

### Task 4: Create Auth Provider Context

**Files:**
- Create: `components/auth/AuthProvider.tsx`

- [ ] **Step 1: Create AuthProvider component**

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 2: Commit**

```bash
git add components/auth/AuthProvider.tsx
git commit -m "feat: add AuthProvider context for authentication state"
```

---

### Task 5: Update Layout to Include AuthProvider

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Wrap root layout with AuthProvider**

```typescript
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Script from "next/script"
import { AuthProvider } from "@/components/auth/AuthProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "个人饮食记录",
  description: "记录每日饮食，AI智能解析营养摄入",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
      <Script src="/mcp-client-v2.js" strategy="afterInteractive" />
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wrap app with AuthProvider"
```

---

### Task 6: Create Navbar Component

**Files:**
- Create: `components/layout/Navbar.tsx`

- [ ] **Step 1: Create Navbar component**

```typescript
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { LogOut, User } from 'lucide-react'

export function Navbar() {
  const { user } = useAuth()

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-white font-semibold text-lg">饮食记录</span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white/80">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat: add Navbar component with user info and logout"
```

---

### Task 7: Create Login Form Component

**Files:**
- Create: `components/auth/LoginForm.tsx`

- [ ] **Step 1: Create LoginForm component**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError('邮箱或密码错误')
        return
      }

      router.push('/')
    } catch (err) {
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
          密码
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '登录中...' : '登录'}
      </button>

      <div className="text-center text-white/70 text-sm">
        还没有账号？{' '}
        <Link href="/auth/signup" className="text-pink-400 hover:text-pink-300">
          注册
        </Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/auth/LoginForm.tsx
git commit -m "feat: add LoginForm component with validation and error handling"
```

---

### Task 8: Create Login Page

**Files:**
- Create: `app/auth/login/page.tsx`

- [ ] **Step 1: Create login page**

```typescript
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="fixed inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <div className="glass-card backdrop-blur-xl bg-white/10 rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">🍽️ 饮食记录</h1>
              <p className="text-white/70">登录您的账户</p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/login/page.tsx
git commit -m "feat: add login page with glassmorphism design"
```

---

### Task 9: Create Signup Form Component

**Files:**
- Create: `components/auth/SignupForm.tsx`

- [ ] **Step 1: Create SignupForm component**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 位')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('该邮箱已被注册，请直接登录')
        } else {
          setError(error.message)
        }
        return
      }

      router.push('/auth/login?registered=true')
    } catch (err) {
      setError('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
          密码
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="至少 6 位密码"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
          确认密码
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="再次输入密码"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '注册中...' : '注册'}
      </button>

      <div className="text-center text-white/70 text-sm">
        已有账号？{' '}
        <Link href="/auth/login" className="text-pink-400 hover:text-pink-300">
          登录
        </Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/auth/SignupForm.tsx
git commit -m "feat: add SignupForm component with password confirmation"
```

---

### Task 10: Create Signup Page

**Files:**
- Create: `app/auth/signup/page.tsx`

- [ ] **Step 1: Create signup page**

```typescript
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="fixed inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <div className="glass-card backdrop-blur-xl bg-white/10 rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">🍽️ 饮食记录</h1>
              <p className="text-white/70">创建您的账户</p>
            </div>

            <SignupForm />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/signup/page.tsx
git commit -m "feat: add signup page with glassmorphism design"
```

---

### Task 11: Create Middleware for Route Protection

**Files:**
- Create: `app/middleware.ts`

- [ ] **Step 1: Create middleware for route protection**

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to login if not authenticated and trying to access protected routes
  if (!session && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect to home if authenticated and trying to access auth pages
  if (session && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add app/middleware.ts
git commit -m "feat: add middleware for route protection"
```

---

### Task 12: Update Main Page to Include Navbar

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update page.tsx to add Navbar and adjust layout**

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Navbar } from '@/components/layout/Navbar'
import DietLogPage from '@/components/pages/DietLogPage'
import ManagementPage from '@/components/pages/ManagementPage'

type TabType = 'diet-log' | 'management'

export default function Home() {
  const { loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('diet-log')

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="fixed inset-0 pt-16">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 pt-16">
        {/* Header */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center tracking-wide" style={{ textShadow: '0 0 40px rgba(255,255,255,0.3)' }}>
            🍽️ 饮食记录
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 px-4">
          <div className="glass-card backdrop-blur-xl bg-white/10 rounded-2xl p-2 border border-white/20 shadow-xl inline-flex gap-2">
            <button
              onClick={() => setActiveTab('diet-log')}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'diet-log'
                  ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg shadow-pink-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              饮食记录
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'management'
                  ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg shadow-pink-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              数据管理
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 pb-8">
          {activeTab === 'diet-log' && <DietLogPage />}
          {activeTab === 'management' && <ManagementPage />}
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add Navbar to main page and adjust layout for auth"
```

---

### Task 13: Update Database Functions to Include User ID

**Files:**
- Modify: `lib/supabase/database.ts`

- [ ] **Step 1: Update getDietLogs function to automatically filter by user**

```typescript
export async function getDietLogs() {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('diet_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching diet logs:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error fetching diet logs:', error)
    return []
  }
}
```

- [ ] **Step 2: Update addDietLog function to include user_id**

```typescript
export async function addDietLog(log: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('diet_logs')
      .insert({ ...log, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('Error adding diet log:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error adding diet log:', error)
    return null
  }
}
```

- [ ] **Step 3: Update deleteDietLog function**

```typescript
export async function deleteDietLog(id: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { error } = await supabase
      .from('diet_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting diet log:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error deleting diet log:', error)
    return false
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/database.ts
git commit -m "feat: update database functions to include user_id for data isolation"
```

---

### Task 14: Create Test Instructions Document

**Files:**
- Create: `docs/superplans/authentication-testing.md`

- [ ] **Step 1: Create testing documentation**

```markdown
# Authentication Testing Guide

## Prerequisites

1. Configure Supabase environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Run database migrations in Supabase dashboard or CLI:
   ```bash
   supabase db push
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Test Cases

### 1. Unauthenticated Access
- [ ] Visit http://localhost:3000
- Expected: Redirected to /auth/login

### 2. Registration Flow
- [ ] Visit /auth/signup
- [ ] Enter a new email and password (min 6 chars)
- [ ] Click "注册"
- Expected: Redirected to /auth/login with success message

### 3. Duplicate Registration
- [ ] Try to register with an already registered email
- Expected: Error message "该邮箱已被注册，请直接登录"

### 4. Login Flow
- [ ] Visit /auth/login
- [ ] Enter registered email and password
- [ ] Click "登录"
- Expected: Redirected to home page, user email shown in navbar

### 5. Invalid Login
- [ ] Enter wrong email or password
- Expected: Error message "邮箱或密码错误"

### 6. Logout Flow
- [ ] Click "退出" button in navbar
- Expected: Redirected to /auth/login

### 7. Protected Routes
- [ ] Try to visit /auth/login while logged in
- Expected: Redirected to home page

### 8. Data Isolation
- [ ] Create two different user accounts
- [ ] Add diet logs as User A
- [ ] Login as User B
- Expected: User B should not see User A's diet logs
```

- [ ] **Step 2: Commit**

```bash
git add docs/superplans/authentication-testing.md
git commit -m "docs: add authentication testing guide"
```

---

## Summary

This plan implements:
1. Supabase environment configuration
2. Database schema with user isolation via RLS
3. Auth context provider for global authentication state
4. Login and signup pages with form validation
5. Route protection via middleware
6. Navbar with user info and logout
7. Updated database functions to include user_id
8. Testing documentation

Total: 14 tasks, 35 steps
