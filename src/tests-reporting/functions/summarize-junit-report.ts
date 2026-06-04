import { JUnitModuleReport } from "./parse-junit-module-report";

export type MarkdownString = string;

export interface TestReport {
  projectName: string;
  projectReport: JUnitModuleReport;
}

export interface TestReportSummary {
  hasErrors: boolean;
  markdownContent: MarkdownString;
}

export interface TestMetadataModule {
  state: string;
  hasTestSources: boolean;
  hasXmlResults: boolean;
}

export interface TestMetadata {
  modules: Record<string, TestMetadataModule>;
  timeoutMinutes: number;
}

export function summarizeJunitReport(
  testReports: TestReport[],
  options?: { onlyErrors: boolean; metadata?: TestMetadata },
): TestReportSummary {
  const onlyErrors = options?.onlyErrors ?? false;
  const metadata = options?.metadata;

  const testReportQuickSummaryRows: string[] = [];
  const testReportDetailsRows: string[] = [];
  const testReportErrorLogs: string[] = [];
  let hasErrors = false;

  let markdownContent = "";

  // Detect missing modules (have test sources but no XML results)
  const missingModules = detectMissingModules(metadata, testReports);
  if (missingModules.length > 0) {
    hasErrors = true;
    const timeoutMin = metadata?.timeoutMinutes ?? 30;
    const moduleLines = missingModules.map((m) => {
      if (m.state === "FAILED") {
        return `- \`${m.name}\` — test task **FAILED** (likely exceeded the ${timeoutMin}-minute timeout). Results for this module are **not included** in the report below.`;
      }
      return `- \`${m.name}\` — test task state: ${m.state}. No test results were produced.`;
    });
    markdownContent += `\n> ⚠️ **${missingModules.length} module(s) with tests produced no results — investigation required:**\n>\n${moduleLines.map(l => `> ${l}`).join("\n")}\n\n`;
  }

  if (!testReports || testReports.length === 0) {
    return {hasErrors, markdownContent: markdownContent + '\nNo test report were found'};
  }

  const mergedReports = mergeSameProjectReports(testReports);

  // Build cache stats from metadata
  let cachedTests = 0;
  let executedTests = 0;

  for (const report of mergedReports) {
    const project = report.projectName;
    const projectReport: JUnitModuleReport = report.projectReport;
    if (projectReport.failures > 0 || projectReport.errors > 0) hasErrors = true;

    // Determine source (cached vs executed) from metadata
    const moduleState = metadata?.modules?.[project]?.state;
    const sourceIcon = moduleState === "FROM_CACHE" ? "📦" : "🔄";
    if (moduleState === "FROM_CACHE") {
      cachedTests += projectReport.tests;
    } else {
      executedTests += projectReport.tests;
    }

    const statusCol = metadata
        ? `${escapePipe(mapStatusToEmoji(projectReport.status))} ${sourceIcon}`
        : escapePipe(mapStatusToEmoji(projectReport.status));
    testReportQuickSummaryRows.push(
      `| ${escapePipe(report.projectName)} | ${statusCol} | ${escapePipe(projectReport.success)} | ${escapePipe(projectReport.skipped)} | ${projectReport.errors + projectReport.failures} |`,
    );

    for (const testsuite of projectReport.testsuites) {
      for (const testcase of testsuite.testcases) {
        const name = testcase.name ?? "";
        const duration = safeNum(testcase.time);
        const failed = testcase.status === "failed" || testcase.status === "error";
        if (failed) hasErrors = true;
        if (onlyErrors) {
          if (failed) {
            const message = testcase.message ?? "";
            const details = testcase.details ? "\n\n" + testcase.details : "";

            const errorSummary = `${escapePipe(project)} > ${escapePipe(testsuite.name)} > ${escapePipe(name)} ${mapStatusToEmoji(testcase.status)} in ${duration}`;
            testReportErrorLogs.push(
              `${spoilerBlock(errorSummary, codeBlock(message + details))}\n`,
            );
          }
        } else {
          testReportDetailsRows.push(
            `| ${escapePipe(project)} | ${escapePipe(testsuite.name)} | ${escapePipe(name)} | ${mapStatusToEmoji(testcase.status)} | ${duration} | ${escapePipe(truncate(testcase.message ?? "", 200))} |`,
          );
        }
      }
    }
  }
  const totalTests = testReports.map((r) => r.projectReport.tests).reduce((a, b) => a + b);
  const totalSuccess = testReports.map((r) => r.projectReport.success).reduce((a, b) => a + b);
  const totalSkipped = testReports.map((r) => r.projectReport.skipped).reduce((a, b) => a + b);
  const totalErrors = testReports
    .map((r) => r.projectReport.failures + r.projectReport.errors)
    .reduce((a, b) => a + b);
  const finalTestStatus = hasErrors ? 'failed' : 'success';
  markdownContent =
    markdownContent +
    `\n${mapStatusToEmoji(finalTestStatus)} > tests: ${totalTests}, success: ${totalSuccess}, skipped: ${totalSkipped}, failed: ${totalErrors}`;

  if (metadata && (cachedTests > 0 || executedTests > 0)) {
    markdownContent += ` (🔄 ${executedTests} executed, 📦 ${cachedTests} from cache)`;
  }
  markdownContent += "\n";

  let tableMarkdown = `\n| Project | Status | Success | Skipped | Failed |\n|---|---|---|---|---|`;
  tableMarkdown = tableMarkdown + "\n" + [...testReportQuickSummaryRows].join("\n");
  if (testReportDetailsRows.length > 0) {
    tableMarkdown = tableMarkdown + "\n\n" + "## Tests report details:";
    const header = `| Project | Suite | Test | Status | Duration (s) | Message |\n|---|---|---|---|---:|---|`;
    tableMarkdown = tableMarkdown + "\n" + [header, ...testReportDetailsRows].join("\n");
  }
  if (testReportErrorLogs.length > 0) {
    tableMarkdown = tableMarkdown + "\n## Failed tests:";
    tableMarkdown = tableMarkdown + "\n" + [...testReportErrorLogs].join("\n");
  }

  if(finalTestStatus === 'success'){
    markdownContent = markdownContent + spoilerBlock('unfold for details', tableMarkdown);
  } else {
    markdownContent = markdownContent + tableMarkdown;
  }

  return { hasErrors, markdownContent };
}

function detectMissingModules(
    metadata: TestMetadata | undefined,
    testReports: TestReport[],
): Array<{ name: string; state: string }> {
  if (!metadata?.modules) return [];
  const reportedProjects = new Set(
      mergeSameProjectReports(testReports).map((r) => r.projectName),
  );
  const missing: Array<{ name: string; state: string }> = [];
  for (const [name, mod] of Object.entries(metadata.modules)) {
    if (mod.hasTestSources && !mod.hasXmlResults && !reportedProjects.has(name)) {
      if (mod.state === "FAILED" || mod.state === "NOT_RUN") {
        missing.push({ name, state: mod.state });
      }
    }
  }
  return missing;
}

// merge reports that share the same projectName by concatenating testsuites
function mergeSameProjectReports(reports: TestReport[]): TestReport[] {
  const byProject = new Map<string, JUnitModuleReport>();

  for (const r of reports) {
    const key = r.projectName;
    const existing = byProject.get(key);
    if (!existing) {
      // clone a shallow copy so we don't mutate the original
      const cloned: JUnitModuleReport = {
        ...r.projectReport,
        testsuites: [...r.projectReport.testsuites],
      } as JUnitModuleReport;
      computeModuleAggregates(cloned);
      byProject.set(key, cloned);
    } else {
      // concatenate testsuites and recompute aggregates
      existing.testsuites = [...existing.testsuites, ...r.projectReport.testsuites];
      computeModuleAggregates(existing);
    }
  }

  // rebuild TestReport array
  return Array.from(byProject.entries()).map(([projectName, projectReport]) => ({
    projectName,
    projectReport,
  }));
}

// recompute success/skip/error/failure counts and overall status from suite-level attributes
// (which are parsed directly from XML and are authoritative), not from testcase iteration
// (which can undercount when test XML uses <flakyFailure>/<rerunFailure> elements)
function computeModuleAggregates(moduleReport: JUnitModuleReport): void {
  let success = 0;
  let skipped = 0;
  let errors = 0;
  let failures = 0;

  for (const suite of moduleReport.testsuites) {
    failures += suite.failures;
    errors += suite.errors;
    skipped += suite.skipped;
    success += suite.success;
  }

  const total = success + skipped + errors + failures;
  // update known aggregate fields if present on the type
  moduleReport.success = success;
  moduleReport.skipped = skipped;
  moduleReport.errors = errors;
  moduleReport.failures = failures;
  if ("tests" in moduleReport) {
    moduleReport.tests = total;
  }

  // status rules: all skipped => skipped; any error => error; any failed => failed; else success
  let status: "success" | "failed" | "error" | "skipped";
  if (total > 0 && skipped === total) status = "skipped";
  else if (errors > 0) status = "error";
  else if (failures > 0) status = "failed";
  else status = "success";
  moduleReport.status = status;
}

// helpers scoped below
function escapePipe(s: string | number | undefined): string {
  const str = s == null ? "" : String(s);
  // escape pipe and newlines for markdown table cells
  return str.replace(/\|/g, "\\|").replace(/\r?\n/g, " ↵ ");
}

function codeBlock(s: string | number | undefined): string {
  const str = s == null ? "" : String(s);
  return `\`\`\`\n${str}\n\`\`\`\n`;
}

function spoilerBlock(summary: string, content: string): string {
  return `<details>
<summary>${summary}</summary>

${content}
</details>\n`;
}

function truncate(s: string, max: number): string {
  return s && s.length > max ? s.slice(0, max - 1) + "…" : s || "";
}

function safeNum(v: number | undefined): string {
  if (v === undefined || v === null) return "";
  const n = typeof v === "number" ? v : Number(String(v));
  if (Number.isFinite(n)) return n.toFixed(3).replace(/\.000$/, "");
  return String(v);
}

function mapStatusToEmoji(status: "success" | "failed" | "error" | "skipped"): string {
  switch (status) {
    case "failed":
      return "failed ❌";
    case "error":
      return "error ❌";
    case "skipped":
      return "skipped ⏭️";
    case "success":
      return "success ✅";
    default:
      throw new Error("Unhandled case");
  }
}
