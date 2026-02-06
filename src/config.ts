import type { IConfig } from '@/types.ts'
import { join } from 'node:path'
import process from 'node:process'

export const resolveConfig = (symLinkPath: string): IConfig => {
    return {
        cwd: process.cwd(),
        symLinkPath,
        globalRoot: process.platform === 'win32' ? join(symLinkPath, 'node_modules') : join(symLinkPath, 'lib', 'node_modules'),
    }
}
