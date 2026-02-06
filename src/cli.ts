import type { ISymLinkProjects } from '@/types.ts'
import { cancel, intro, isCancel, multiselect } from '@clack/prompts'
import { createMain, defineCommand } from 'citty'
import pc from 'picocolors'
import { resolveConfig } from '@/config.ts'
import { cleanBinaries, getGlobalPrefix, getSymLinkList } from '@/utils.ts'
import { description, name, version } from '../package.json'

const command = defineCommand({
    meta: {
        name,
        version,
        description,
    },
    setup() {
        intro(pc.bgCyan(` ${name} [v${version}]`))
    },
    async run({ args }) {
        const symLinkPath = await getGlobalPrefix()
        const config = resolveConfig(symLinkPath)

        const symLinks = await getSymLinkList(config)

        const selectOptions = Object.entries(symLinks).map(([name, pkgInfo]) => ({
            value: name,
            label: `${name}`,
            hint: pkgInfo.bin.join(','),
        }))

        const selectedLinks = await multiselect({
            message: 'Select links to remove',
            options: selectOptions,
        })

        if (isCancel(selectedLinks)) {
            cancel('Operation cancelled')
            process.exit(0)
        }

        await cleanBinaries(
            config,
            selectedLinks.map(name => symLinks[name]).filter(Boolean) as ISymLinkProjects[],
        )
    },
})

createMain(command)({})
