import { cancel, intro, isCancel, multiselect } from '@clack/prompts'
import { createMain, defineCommand } from 'citty'
import pc from 'picocolors'
import { resolveConfig } from '@/config.ts'
import { getGlobalPrefix, getSymLinkList } from '@/utils.ts'
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

        const links = await getSymLinkList(config)

        const selectOptions = links.map(link => ({
            value: link.name,
            label: `${link.name}`,
            hint: link.bin.join(','),
        }))

        const selectedLinks = await multiselect({
            message: 'Select links to remove',
            options: selectOptions,
        })

        if (isCancel(selectedLinks)) {
            cancel('Operation cancelled')
            process.exit(0)
        }

        console.log(selectedLinks)
    },
})

createMain(command)({})
