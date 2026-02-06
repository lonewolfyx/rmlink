import type { IConfig, ISymLinkProjects, ISymLinksMap } from '@/types.ts'
import { lstat, readdir, readFile, readlink } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
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
