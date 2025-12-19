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
        integrationTestReportsLocationPattern?: "**/build/test-results/integrationTest/*.xml";
    },
): Promise<{output: MarkdownString, status: 'success' | 'failure'}> {
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
    
    // INTEGRATION
    const integrationTestPattern = options?.integrationTestReportsLocationPattern ?? "**/build/test-results/integrationTest/*.xml";

    // Find matching report files under the provided working directory
    const junitXmlIntegrationTestReportsFilenames = await fg.async(integrationTestPattern, {
        cwd: workingDir,
        absolute: true,
        onlyFiles: true,
        dot: true,
        followSymbolicLinks: true,
    });

    // Parse each JUnit report into a module-level structure
    const moduleIntegrationTestReports: TestReport[] = junitXmlIntegrationTestReportsFilenames.map((file) => {
        const content = fs.readFileSync(file, "utf-8");
        return {
            projectName: getJavaProjectNameFromBuildAbsolutePath(file),
            projectReport: parseJunitModuleReport(content),
        };
    });
    
    // FLAKY TEST
    const flakyTestPattern = options?.flakyTestReportsLocationPattern ?? "**/build/test-results/flakyTest/*.xml";

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
    const testReport = summarizeJunitReport(moduleTestReports, {onlyErrors: onlyErrors});
    let markdownContent =  "## Tests report quick summary:" + testReport.markdownContent;

    if (moduleIntegrationTestReports && moduleIntegrationTestReports.length > 0) {
        markdownContent = markdownContent + "\n\n---\n\n## Integration tests report quick summary:" + summarizeJunitReport(moduleIntegrationTestReports, {onlyErrors: onlyErrors}).markdownContent;
    }
    
    if (moduleFlakyTestReports && moduleFlakyTestReports.length > 0) {
        markdownContent = markdownContent + "\n\n---\n\n## Flaky tests report quick summary:" + summarizeJunitReport(moduleFlakyTestReports, {onlyErrors: onlyErrors}).markdownContent;
    }
    return {output: markdownContent, status: testReport.hasErrors ? 'failure' : 'success'}
}
