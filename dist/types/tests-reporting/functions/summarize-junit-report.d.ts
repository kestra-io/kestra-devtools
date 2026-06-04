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
export declare function summarizeJunitReport(testReports: TestReport[], options?: {
    onlyErrors: boolean;
    metadata?: TestMetadata;
}): TestReportSummary;
