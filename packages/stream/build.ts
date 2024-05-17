import { buildConfig } from "@pravah/build"
import { $ } from 'bun'

await $`rm -rf dist`
console.log(buildConfig)
await Bun.build(buildConfig)
await $`bun tsc`