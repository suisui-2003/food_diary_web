# 饮食记录系统 - 邮箱密码登录功能设计

**日期:** 2026-05-03
**方案:** 基于 Supabase 的邮箱密码认证

## 概述

为饮食记录系统添加邮箱密码登录功能，实现用户认证和数据隔离。每个用户只能查看和管理自己的饮食记录。

## 架构设计

### 技术栈
- `@supabase/auth-helpers-nextjs` - Next.js 集成
- Supabase Auth - 用户认证
- Row Level Security (RLS) - 数据隔离
- Supabase Client - 数据库操作

### 文件结构
```
app/
  ├── auth/
  │   ├── login/
  │   │   └── page.tsx        # 登录页面
  │   └── signup/
  │       └── page.tsx        # 注册页面
  ├── middleware.ts            # 路由保护中间件
components/
  ├── auth/
  │   ├── LoginForm.tsx        # 登录表单组件
  │   ├── SignupForm.tsx       # 注册表单组件
  │   └── AuthGuard.tsx        # 认证包装组件
  └── layout/
      └── Navbar.tsx           # 导航栏组件
lib/
  ├── supabase/
  │   ├── server.ts            # 服务端 Supabase 客户端
  │   └── client.ts            # 客户端 Supabase 客户端
```

### 认证流程
1. 用户访问应用 → 检查是否已登录（Supabase session）
2. 未登录 → 显示登录/注册页面
3. 用户输入邮箱密码 → 调用 Supabase Auth API
4. 登录成功 → 保存 session，跳转到主页面
5. 已登录 → 显示主页面，所有数据请求自动附带认证信息

## 数据库设计

### 表结构修改
```sql
-- 饮食记录表添加 user_id 字段
ALTER TABLE diet_logs
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 添加索引提高查询性能
CREATE INDEX idx_diet_logs_user_id ON diet_logs(user_id);
CREATE INDEX idx_diet_logs_user_date ON diet_logs(user_id, date);
```

### Row Level Security 策略
```sql
-- 启用 RLS
ALTER TABLE diet_logs ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能查看自己的记录
CREATE POLICY "Users can view own logs"
ON diet_logs FOR SELECT
USING (auth.uid() = user_id);

-- 策略：用户只能插入自己的记录
CREATE POLICY "Users can insert own logs"
ON diet_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 策略：用户只能更新自己的记录
CREATE POLICY "Users can update own logs"
ON diet_logs FOR UPDATE
USING (auth.uid() = user_id);

-- 策略：用户只能删除自己的记录
CREATE POLICY "Users can delete own logs"
ON diet_logs FOR DELETE
USING (auth.uid() = user_id);
```

## UI/UX 设计

### 登录页面
- 居中的登录卡片，玻璃拟态设计（与现有风格一致）
- 邮箱输入框 + 密码输入框
- "登录" 和 "注册" 两个按钮（或切换表单）
- 忘记密码链接
- 错误提示在表单下方显示

### 注册页面
- 居中的注册卡片
- 邮箱输入框 + 密码输入框 + 确认密码输入框
- "注册" 按钮
- "已有账号？去登录" 链接
- 表单验证（密码强度、邮箱格式等）

### 导航栏（登录后）
- 在页面顶部添加导航栏
- 左侧：应用标题 "🍽️ 饮食记录"
- 右侧：用户邮箱 + 退出登录按钮

### 交互流程
```
访问应用
  ↓
检查登录状态（中间件）
  ↓ 未登录
登录/注册页面
  ↓ 登录成功
主页面（显示用户数据）
  ↓ 点击退出
清除 session，跳转登录页
```

## API 设计

### 认证 API（Supabase 内置）
- `supabase.auth.signUp()` - 注册
- `supabase.auth.signInWithPassword()` - 登录
- `supabase.auth.signOut()` - 退出

### 中间件逻辑
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })
  const { data: { session } } = await supabase.auth.getSession()

  // 未登录且访问受保护路由 → 重定向到登录页
  if (!session && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 已登录且访问认证页面 → 重定向到主页
  if (session && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}
```

### 现有 API 修改
- 所有饮食记录相关的 API 路由需要获取当前用户 ID
- Supabase 客户端会自动从请求中提取认证信息
- RLS 策略会自动过滤数据，无需手动过滤

## 错误处理

### 认证错误
- **邮箱已存在**：注册时提示"该邮箱已被注册，请直接登录"
- **密码错误**：登录时提示"邮箱或密码错误"
- **网络错误**：显示"连接失败，请检查网络后重试"
- **验证失败**：实时显示字段错误（邮箱格式、密码长度等）

### 数据库错误
- **权限错误**：RLS 拒绝时显示"无权访问该数据"
- **连接错误**：显示"数据加载失败，请稍后重试"

### 用户反馈方式
- 表单下方显示错误提示
- 使用 Toast 通知成功/失败消息
- 加载状态显示在按钮上

## 安全考虑

### 安全措施
- **密码存储**：由 Supabase 自动加密存储（PBKDF2）
- **HTTPS**：生产环境强制使用 HTTPS
- **Session 管理**：Supabase 自动处理 session 过期和刷新
- **CSRF 保护**：使用 Supabase 的内置 CSRF 令牌
- **输入验证**：前后端双重验证，防止 SQL 注入

### 隐私保护
- 用户邮箱仅用于认证，不对外公开
- 所有饮食记录数据通过 RLS 隔离
- 符合数据保护要求

## 环境配置

需要在 `.env.local` 中添加：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
