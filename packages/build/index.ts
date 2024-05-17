import type { BuildConfig } from 'bun';

const pkgJson = await Bun.file("./package.json").json();
const entrypoints = [`./index.ts`]
const outdir = `./dist`
const external = Object.keys(pkgJson.peerDependencies)

const buildConfig: BuildConfig = {
    entrypoints: entrypoints,
    outdir: outdir,
    external
}

export { buildConfig };
