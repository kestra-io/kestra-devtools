import { getWorkingDir } from "./utilities/working-dir";
import {exportTestReportSummary} from "./tests-reporting/export-test-report-summary";
import {getPRContext} from "./github-context";

/**
 * Build-time injected constant defined via Vite `define` in vite.config.ts
 *   define: { __APP_VERSION__: JSON.stringify(pkg.version) }
 */
declare const __APP_VERSION__: string;

function parseArgs(argv: string[]) {
    // argv[0] = node, argv[1] = script, rest are args
    const args = argv.slice(2);
    const flags: Record<string, string | boolean> = {};
    const positionals: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a.startsWith("--")) {
            const [k, v] = a.slice(2).split("=");
            flags[k] = v ?? true;
        } else if (a.startsWith("-") && a.length > 1) {
            const letters = a.slice(1).split("");
            letters.forEach((l) => (flags[l] = true));
        } else {
            positionals.push(a);
        }
    }

    return { flags, positionals };
}

const helpText = `kestra-devtools version: ${__APP_VERSION__}

A CLI utility to help with various development tasks

Usage:
kestra-devtools [command] [...]

Options:
-h, --help     Show help
-v, --version  Show version

Examples:
kestra-devtools generateTestReportSummary $(pwd) --only-errors

`;

export async function main(argv = process.argv) {
    const { flags, positionals } = parseArgs(argv);

    if (flags.h || flags.help) {
        console.log(helpText);
        return 0;
    }

    if (positionals[0] === "generateTestReportSummary") {
        const dirArg = positionals[1];
        if (!dirArg) {
            console.error(
                "Error: missing working directory argument.\nUsage: kestra-devtools generateTestReportSummary <absolute-path>",
            );
            return 1;
        }
        const ci = Boolean(flags["ci"]);
        const workingDir = getWorkingDir(dirArg);
        const summary = await exportTestReportSummary(workingDir, {
            onlyErrors: Boolean(flags["only-errors"]),
            githubContext: ci ? getPRContext() : undefined
        });
        // Print to stdout so it can be piped in CI or viewed in terminal
        console.log(summary);
        return 0;
    }

    if (flags.v || flags.version) {
      console.log(`kestra-devtools version: ${__APP_VERSION__}`);
      return 0;
    }

    console.log(helpText);
    return 0;
}
