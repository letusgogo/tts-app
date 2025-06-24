// src/app/page.tsx
"use client"

import React from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useTranslations } from 'next-intl';
import VoiceManage from "@/components/VoiceManage";

export default function Home() {
  const { data: session } = useSession()
  const translation = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8 relative">
      {/* 登录按钮区域 */}
      <div className="absolute top-4 right-8 z-50">
        {session ? (
          <div className="flex items-center gap-2">
            <span>Hi, {session.user?.name || session.user?.email}</span>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => signOut()}>{translation('logout')}</button>
          </div>
        ) : (
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => signIn("casdoor")}>{translation('login')}</button>
        )}
      </div>
      <VoiceManage />
    </div>
  )
}
