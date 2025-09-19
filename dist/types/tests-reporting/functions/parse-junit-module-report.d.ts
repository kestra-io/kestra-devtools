export type JUnitModuleReport = {
    suites: number;
    tests: number;
    failures: number;
    errors: number;
    skipped: number;
    success: number;
    status: "success" | "failed" | "error" | "skipped";
    time: number;
    testsuites: Array<JunitTestSuite>;
};
export interface JunitTestSuite {
    name?: string;
    tests: number;
    failures: number;
    errors: number;
    skipped: number;
    success: number;
    status: "success" | "failed" | "error" | "skipped";
    time: number;
    testcases: Array<JunitTestCase>;
}
export interface JunitTestCase {
    classname?: string;
    name: string;
    time?: number;
    status: "success" | "failed" | "error" | "skipped";
    message?: string;
    type?: string;
    details?: string;
}
export declare function parseJunitModuleReport(xml: string): JUnitModuleReport;
/**
 * Convenience: parse a file from disk.
 */
export declare function summarizeJunitReportFromFile(filePath: string): Promise<JUnitModuleReport>;
