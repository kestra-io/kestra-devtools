import {WorkingDir} from "../utilities/working-dir";
import {MarkdownString, summarizeJunitReport, TestMetadata, TestReport,} from "./functions/summarize-junit-report";
import {parseJunitModuleReport} from "./functions/parse-junit-module-report";
import fg from "fast-glob";
import fs from "fs";
import path from "path";
import {getJavaProjectNameFromBuildAbsolutePath} from "./functions/file-path-utils";

function loadTestMetadata(workingDir: WorkingDir): TestMetadata | undefined {
    const metadataPath = path.join(workingDir, "build", "test-metadata.json");
    if (!fs.existsSync(metadataPath)) {
        return undefined;
    }
    try {
        return JSON.parse(fs.readFileSync(metadataPath, "utf-8")) as TestMetadata;
    } catch {
        return undefined;
    }
}

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
    const metadata = loadTestMetadata(workingDir);

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
    const testReport = summarizeJunitReport(moduleTestReports, {onlyErrors: onlyErrors, metadata: metadata});
    let markdownContent =  "## Tests report quick summary:" + testReport.markdownContent;

    const develocityScanUri = getDevelocityScanUri(workingDir);
    if (develocityScanUri) {
        markdownContent = markdownContent + `\n\n---\n\n Develocity build scan: ${develocityScanUri}`;
    }

    if (moduleIntegrationTestReports && moduleIntegrationTestReports.length > 0) {
        markdownContent = markdownContent + "\n\n---\n\n## Integration tests report quick summary:" + summarizeJunitReport(moduleIntegrationTestReports, {onlyErrors: onlyErrors}).markdownContent;
    }
    
    if (moduleFlakyTestReports && moduleFlakyTestReports.length > 0) {
        markdownContent = markdownContent + "\n\n---\n\n## Flaky tests report quick summary:" + summarizeJunitReport(moduleFlakyTestReports, {onlyErrors: onlyErrors}).markdownContent;
    }
    return {output: markdownContent, status: testReport.hasErrors ? 'failure' : 'success'}
}

function getDevelocityScanUri(workingDir: WorkingDir): string | undefined {
    const scanOutputPath = path.join(workingDir, "develocity-scan-output.ndjson");
    if (!fs.existsSync(scanOutputPath)) {
        return undefined;
    }

    const content = fs.readFileSync(scanOutputPath, "utf-8");
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
        try {
            const payload = JSON.parse(line);
            const taskNames = payload?.taskNames;
            const hasCheckTask =
                Array.isArray(taskNames) && taskNames.some((task: string) => task.includes("check"));
            if (hasCheckTask && typeof payload.buildScanUri === "string" && payload.buildScanUri.length > 0) {
                return payload.buildScanUri;
            }
        } catch {
            continue;
        }
    }

    return undefined;
}
