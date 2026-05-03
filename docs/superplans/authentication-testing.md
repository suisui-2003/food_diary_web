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
