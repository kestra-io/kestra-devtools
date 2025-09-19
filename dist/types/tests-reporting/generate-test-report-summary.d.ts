import { WorkingDir } from "../utilities/working-dir";
import { MarkdownString } from "./functions/summarize-junit-report";
/**
 * parse files located at 'testReportsLocationPattern' and generate a summary in Markdown
 * @param workingDir
 * @param options
 */
export declare function generateTestReportSummary(workingDir: WorkingDir, options?: {
    onlyErrors?: boolean;
    testReportsLocationPattern?: "**/build/test-results/test/*.xml";
}): Promise<MarkdownString>;
