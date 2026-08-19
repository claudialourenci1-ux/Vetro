import { FlatCompat } from '@eslint/eslintrc'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const baseDirectory = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory })

export default [...compat.extends('next/core-web-vitals', 'next/typescript')]
