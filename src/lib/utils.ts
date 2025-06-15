import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 词条类型：key 是语言代码，val 是该语言的词条
export type LocaleEntries = {
  [lang: string]: string
}

// 示例用法
export const helloText: LocaleEntries = {
  "zh-CN": "你好",
  "en-US": "Hello",
  "ja-JP": "こんにちは",
  "es-ES": "Hola",
  "fr-FR": "Bonjour"
}

