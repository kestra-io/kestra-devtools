import {WorkingDir} from "../utilities/working-dir";
import {MarkdownString, summarizeJunitReport, TestReport,} from "./functions/summarize-junit-report";
import {parseJunitModuleReport} from "./functions/parse-junit-module-report";
import fg from "fast-glob";
import fs from "fs";
import {getJavaProjectNameFromBuildAbsolutePath} from "./functions/file-path-utils";

/**
 * parse files located at 'testReportsLocationPattern' and generate a summary in Markdown
 * @param workingDir
 * @param options
 */
export async function generateTestReportSummary(
    workingDir: WorkingDir,
    options?: {
        onlyErrors?: boolean;
        testReportsLocationPattern?: "**/build/test-results/test/*.xml";
        flakyTestReportsLocationPattern?: "**/build/test-results/flakyTest/*.xml";
    },
): Promise<MarkdownString> {
    const onlyErrors = options?.onlyErrors ?? false;
    const testPattern = options?.testReportsLocationPattern ?? "**/build/test-results/test/*.xml";

    // Find matching report files under the provided working directory
    const junitXmlTestReportsFilenames = await fg.async(testPattern, {
        cwd: workingDir,
        absolute: true,
        onlyFiles: true,
        dot: true,
        followSymbolicLinks: true,
    });

    // Parse each JUnit report into a module-level structure
    const moduleTestReports: TestReport[] = junitXmlTestReportsFilenames.map((file) => {
        const content = fs.readFileSync(file, "utf-8");
        return {
            projectName: getJavaProjectNameFromBuildAbsolutePath(file),
            projectReport: parseJunitModuleReport(content),
        };
    });

    const flakyTestPattern = options?.testReportsLocationPattern ?? "**/build/test-results/flakyTest/*.xml";

    // Find matching report files under the provided working directory
    const junitXmlFlakyTestReportsFilenames = await fg.async(flakyTestPattern, {
        cwd: workingDir,
        absolute: true,
        onlyFiles: true,
        dot: true,
        followSymbolicLinks: true,
    });

    // Parse each JUnit report into a module-level structure
    const moduleFlakyTestReports: TestReport[] = junitXmlFlakyTestReportsFilenames.map((file) => {
        const content = fs.readFileSync(file, "utf-8");
        return {
            projectName: getJavaProjectNameFromBuildAbsolutePath(file),
            projectReport: parseJunitModuleReport(content),
        };
    });

    // Summarize all parsed reports into a single Markdown string
    const markdownContent =  "## Tests report quick summary:" + summarizeJunitReport(moduleTestReports, {onlyErrors: onlyErrors}).markdownContent;

    if (!moduleFlakyTestReports || moduleFlakyTestReports.length === 0) {
        return markdownContent
    }
    return  markdownContent + "\n---\n## Flaky tests report quick summary:" + summarizeJunitReport(moduleFlakyTestReports, {onlyErrors: onlyErrors}).markdownContent;
}
