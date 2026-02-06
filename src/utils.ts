import type { IConfig, ISymLinkProjects, ISymLinksMap } from '@/types.ts'
import { existsSync } from 'node:fs'
import { lstat, readdir, readFile, readlink, rm } from 'node:fs/promises'
import os from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import pc from 'picocolors'
import { x } from 'tinyexec'

export const getGlobalPrefix = async (): Promise<string> => {
    const { stdout } = await x('npm', ['config', 'get', 'prefix'], {
        nodeOptions: {
            cwd: process.cwd(),
        },
    })
    return stdout.trim()
}

export const isSymlink = async (p: string): Promise<boolean> => {
    return (await lstat(p)).isSymbolicLink()
}

export const getSymLinkList = async (config: IConfig): Promise<ISymLinksMap> => {
    const symlinks: ISymLinkProjects[] = []

    async function scan(dir: string, scope = '') {
        const files = await readdir(dir)

        for (const file of files) {
            const fullPath = join(dir, file)
            const stat = await lstat(fullPath)

            if (stat.isSymbolicLink()) {
                const pkgName = scope ? `${scope}/${file}` : file

                let realPath: string = ''

                realPath = await readlink(fullPath)
                if (!isAbsolute(realPath)) {
                    realPath = resolve(dirname(fullPath), realPath)
                }

                const pkgJsonPath = join(realPath, 'package.json')
                const pkgContent = JSON.parse(await readFile(pkgJsonPath, 'utf-8'))

                symlinks.push({
                    name: pkgName,
                    path: fullPath,
                    realPath,
                    bin: (typeof pkgContent.bin === 'string') ? [pkgContent.name] : Object.keys(pkgContent.bin),
                })
            }
            else if (stat.isDirectory() && file.startsWith('@')) {
                await scan(fullPath, file)
            }
        }
    }

    await scan(config.globalRoot)

    return Object.fromEntries(
        symlinks.map(item => [item.name, item]),
    )
}

export const cleanBinaries = async (config: IConfig, selected: ISymLinkProjects[]) => {
    const { symLinkPath, globalRoot } = config
    const isWin = os.platform() === 'win32'

    const binDir = isWin ? symLinkPath : join(symLinkPath, 'bin')

    for (const pkg of selected) {
        console.log(pc.blue(`\n正在清理包: ${pkg.name}...`))

        // 1. 清理可执行文件 (bin)
        if (pkg.bin && Array.isArray(pkg.bin)) {
            for (const cmd of pkg.bin) {
                const exits = isWin ? ['', '.cmd', '.ps1'] : ['']
                for (const ext of exits) {
                    const binPath = join(binDir, cmd + ext)
                    console.log(binPath)
                    if (existsSync(binPath)) {
                        await rm(binPath, { force: true })
                        console.log(pc.dim(`  - 已移除二进制: ${cmd}${ext}`))
                    }
                }
            }
        }

        console.log(pkg.path)
        if (existsSync(pkg.path)) {
            await rm(pkg.path, { recursive: true, force: true })
            console.log(pc.dim(`  - 已移除软链接目录: ${pkg.name}`))
        }

        if (pkg.name.startsWith('@')) {
            const scopeDir = dirname(pkg.path)
            console.log(scopeDir)
            const files = await readdir(scopeDir)
            if (files.length === 0) {
                await rm(scopeDir, { recursive: true, force: true })
                console.log(pc.dim(`  - 已清理空的作用域目录: ${basename(scopeDir)}`))
            }
        }
    }
}
