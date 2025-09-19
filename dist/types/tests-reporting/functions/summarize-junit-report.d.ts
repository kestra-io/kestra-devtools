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
export declare function summarizeJunitReport(testReports: TestReport[], options?: {
    onlyErrors: boolean;
}): TestReportSummary;
