export interface IConfig {
    cwd: string
    symLinkPath: string
    globalRoot: string
}

export interface ISymLinkProjects {
    name: string
    path: string
    realPath: string // 本地开发源码的位置
    bin: string[]
}

export type ISymLinksMap = Record<string, ISymLinkProjects>
