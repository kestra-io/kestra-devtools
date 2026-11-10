import { defineConfig } from "vite";
import { builtinModules } from "node:module";
import pkg from './package.json';

// ensure Node-builtins stay external
const externals = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

export default defineConfig({
    build: {
        target: "node18",
        outDir: "dist",
        emptyOutDir: true,
        lib: {
            entry: "src/kestra-devtools.ts",
            formats: ["cjs"],
            fileName: () => "kestra-devtools.cjs",
        },
        rollupOptions: {
            external: externals,
            output: {
                // Make the output an executable CLI. The second line gives the CJS bundle a real
                // `import.meta.url`: bundled ESM-only deps (fdir, via tinyglobby) call
                // createRequire(import.meta.url), which the CJS output otherwise turns into
                // createRequire({}.url) and crashes at load time (1.0.44).
                banner: "#!/usr/bin/env node\nconst __importMetaUrl = require(\"node:url\").pathToFileURL(__filename).href;",
            },
        },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      "import.meta.url": "__importMetaUrl",
    },
});
