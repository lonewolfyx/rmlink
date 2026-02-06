import { createMain, defineCommand } from 'citty'
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
        console.log('Setup')
    },
    async run({ args }) {
        const symLinkPath = await getGlobalPrefix()
        const config = resolveConfig(symLinkPath)

        const links = await getSymLinkList(config)

        console.log(links)
    },
})

createMain(command)({})
