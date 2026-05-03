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
