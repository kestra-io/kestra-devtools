import { getDefaultWorkingDir, validateWorkingDir } from "./utilities/working-dir";
import { exportTestReportSummary } from "./tests-reporting/export-test-report-summary";
import { getPRContext } from "./utilities/github/github-context";
import { checkWorkflowStatus } from "./release-helpers/check-workflow-status";
import { getCompatiblePlugins } from "./tests-reporting/functions/get-compatible-plugins";

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

const generateTestReportSummaryExample = `kestra-devtools generateTestReportSummary $(pwd) --only-errors`;
const generateTestReportSummaryUsageDoc =
  `Usage: kestra-devtools generateTestReportSummary [absolute-path]` +
  `\t--only-errors to only output error and their logs` +
  `\nExample: ${generateTestReportSummaryExample}`;

const checkWorkflowStatusExample = `kestra-devtools checkWorkflowStatus main-build.yml --repo=kestra-ee --branches=releases/v0.22.x,releases/v0.23.x --githubToken=$GH_TOKEN`;
const checkWorkflowStatusUsageDoc =
  `Usage: kestra-devtools checkWorkflowStatus [workflow-name.yml] --repo=[a-kestra-repo] --branches=[comma-separated-branches]` +
  `\t--retry=1 to automatically retry a workflow if it was failed` +
  `\t--json to output json` +
  `\nExample: ${checkWorkflowStatusExample}`;

const getCompatiblePluginsExample = `kestra-devtools getCompatiblePlugins v1.0.0`;
const getCompatiblePluginsUsageDoc =
  `Usage: kestra-devtools getCompatiblePlugins [kestraVersion]` +
  `\nExample: ${checkWorkflowStatusExample}`;

const helpText = `kestra-devtools version: ${__APP_VERSION__}

A CLI utility to help with various development tasks

Usage:
kestra-devtools [command] [...]

Options:
-h, --help     Show help
-v, --version  Show version

Examples:

\t${generateTestReportSummaryExample}

\t${checkWorkflowStatusExample}

\t${getCompatiblePluginsExample}
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
              `Error: missing working directory argument.\n${generateTestReportSummaryUsageDoc}`,
            );
            return 1;
        }
        const ci = Boolean(flags["ci"]);
        const workingDir = validateWorkingDir(dirArg);
        const summary = await exportTestReportSummary(workingDir, {
            onlyErrors: Boolean(flags["only-errors"]),
            githubContext: ci ? getPRContext() : undefined
        });
        // Print to stdout so it can be piped in CI or viewed in terminal
        console.log(summary);
        return 0;
    } else if (positionals[0] === "checkWorkflowStatus") {
      const workflowIdArg = positionals[1];
      if (!workflowIdArg) {
        console.error(
          `Error: missing workflowId argument.\n${checkWorkflowStatusUsageDoc}`,
        );
        return 1;
      }
      const repo = flags["repo"];
      if (!repo || typeof repo !== "string") {
        console.error(
          `Error: missing valid repo argument.\n${checkWorkflowStatusUsageDoc}`,
        );
        return 1;
      }
      const branches = flags["branches"];
      if (!branches || typeof branches !== "string") {
        console.error(
          `Error: missing valid branches argument.\n${checkWorkflowStatusUsageDoc}`,
        );
        return 1;
      }
      const githubToken = flags["githubToken"];
      if (!githubToken || typeof githubToken !== "string") {
        console.error(
          `Error: missing valid githubToken argument.\n${checkWorkflowStatusUsageDoc}`,
        );
        return 1;
      }
      let retry: number | undefined = undefined;
      if (flags["retry"]) {
        retry = parseInt(flags["retry"] as string, 10);
        if (!retry) {
          console.error(
            `Error: invalid retry argument: ${retry} .\n${checkWorkflowStatusUsageDoc}`,
          );
          return 1;
        }
      }
      let notify: boolean | undefined = undefined;
      if (flags["notify"]) {
        notify = true;
      }
      const res = await checkWorkflowStatus(
        githubToken,
        "kestra-io",
        repo,
        workflowIdArg,
        branches.split(","),
        { retry: retry, notify: notify },
      );
      if(flags["json"]){
        console.log(JSON.stringify(res));
      } else {
        console.log(res.output);
      }

      if (res.status === 'failure') {
        return 1;
      } else {
        return 0;
      }
    }else if (positionals[0] === "getCompatiblePlugins"){
      const kestraVersionArg = positionals[1];
      if (!kestraVersionArg) {
        console.error(
          `Error: missing kestra version argument.\n${getCompatiblePluginsUsageDoc}`,
        );
        return 1;
      }
      const compatiblePlugins = await getCompatiblePlugins(
        kestraVersionArg,
        {
          workingDir: getDefaultWorkingDir()
        }
      );
      // Print to stdout so it can be piped in CI or viewed in terminal
      console.log(compatiblePlugins.out);
      return 0;
    }

    if (flags.v || flags.version) {
      console.log(`kestra-devtools version: ${__APP_VERSION__}`);
      return 0;
    }

    console.log(helpText);
    return 0;
}
