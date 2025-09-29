import { describe, expect, it } from "vitest";
import { summarizeJunitReport, TestReport } from "./summarize-junit-report";

describe("summarize-junit-report test", () => {
    const testReportsWithGreenTests: TestReport[] = [
        {
            projectName: "java-module-1",
            projectReport: {
                errors: 0,
                skipped: 0,
                failures: 0,
                success: 1,
                status: "success",
                tests: 1,
                time: 3,
                suites: 1,
                testsuites: [
                    {
                        name: "io.kestra.core.some.Test",
                        errors: 0,
                        skipped: 0,
                        failures: 0,
                        success: 1,
                        status: "success",
                        tests: 1,
                        time: 3,
                        testcases: [
                            {
                                name: "sundayDayOfTheWeekAlias()",
                                classname: "io.kestra.core.some.Test",
                                time: 3,
                                status: "success",
                            },
                        ],
                    },
                ],
            },
        },
    ];
    it("summarizeJunitReport for one green module", async () => {
        const res = summarizeJunitReport(testReportsWithGreenTests);

        expect(res.hasErrors).equal(false);
        expect(res.markdownContent).contains("java-module-1");
        expect(res.markdownContent).contains("sundayDayOfTheWeekAlias()");
        expect(res.markdownContent).contains("io.kestra.core.some.Test");
    });

    it("summarizeJunitReport for one green module should not print tests when onlyErrors:true", async () => {
        const res = summarizeJunitReport(testReportsWithGreenTests, { onlyErrors: true });

        expect(res.hasErrors).equal(false);
        expect(res.markdownContent).contains("java-module-1");
        expect(res.markdownContent).not.contains("sundayDayOfTheWeekAlias()");
        expect(res.markdownContent).not.contains(
            "io.kestra.core.validations.ScheduleValidationTest",
        );
    });

    const testReportWithFailedTests: TestReport[] = [
        {
            projectName: "java-module-1",
            projectReport: {
                errors: 0,
                skipped: 0,
                failures: 1,
                success: 1,
                status: "failed",
                tests: 2,
                time: 3,
                suites: 1,
                testsuites: [
                    {
                        name: "io.kestra.core.someother.Test2",
                        errors: 0,
                        skipped: 0,
                        failures: 1,
                        success: 1,
                        status: "failed",
                        tests: 2,
                        time: 3,
                        testcases: [
                            {
                                name: "sundayDayOfTheWeekAlias()",
                                classname: "io.kestra.core.someother.Test2",
                                time: 3,
                                status: "success",
                            },
                            {
                                name: "failingTest()",
                                classname: "io.kestra.core.someother.Test2",
                                time: 3,
                                status: "failed",
                                message: "java.lang.RuntimeException: I failed and this is my log",
                                details: "this is the error logs details",
                            },
                        ],
                    },
                ],
            },
        },
    ];
    it("summarizeJunitReport for failed tests should summarize all by default without details", async () => {
        const res = summarizeJunitReport(testReportWithFailedTests);

        expect(res.hasErrors).equal(true);
        expect(res.markdownContent).contains("sundayDayOfTheWeekAlias()");
        expect(res.markdownContent).contains("failingTest()");
        expect(res.markdownContent).contains(
            "java.lang.RuntimeException: I failed and this is my log",
        );
        expect(res.markdownContent).not.contains("this is the error logs details");
    });
    it("summarizeJunitReport for failed tests should summarize only errors with details when onlyErrors:true", async () => {
        const res = summarizeJunitReport(testReportWithFailedTests, { onlyErrors: true });

        expect(res.hasErrors).equal(true);
        expect(res.markdownContent).not.contains("sundayDayOfTheWeekAlias()");
        expect(res.markdownContent).contains("failingTest()");
        expect(res.markdownContent).contains(
            "java.lang.RuntimeException: I failed and this is my log",
        );
        expect(res.markdownContent).contains("this is the error logs details");
    });


    it("summarizeJunitReport should merge module reports", async () => {
        // given 1 report the module name should appear twice
        const res1 = summarizeJunitReport(testReportWithFailedTests, { onlyErrors: true });

        expect(res1.hasErrors).equal(true);
        expect(res1.markdownContent).contain("java-module-1");
        expect((res1.markdownContent.match(/java-module-1/g) || []).length).toBe(2);

        // given 2 reports for the same module, but for different tests
        const reports = [...testReportsWithGreenTests, ...testReportWithFailedTests]
        const res2 = summarizeJunitReport(reports, { onlyErrors: true });

        expect(res2.hasErrors).equal(true);
        expect(res2.markdownContent).contain("java-module-1");

        // it should not be duplicated
        expect((res2.markdownContent.match(/java-module-1/g) || []).length).toBe(2);
    });

    it("summarizeJunitReport should print totals", async () => {
        // given 2 reports
        const reports = [...testReportsWithGreenTests, ...testReportWithFailedTests]
        const res = summarizeJunitReport(reports, { onlyErrors: true });

        // it should contains added/merged totals
        expect(res.markdownContent).contain("tests: 3");
        expect(res.markdownContent).contain("failed: 1");
        expect(res.markdownContent).contain("success: 2");
        expect(res.markdownContent).contain("skipped: 0");
    });
  it("summarizeJunitReport should not crash when no reports were found", async () => {
    const res = summarizeJunitReport([], { onlyErrors: true });

    expect(res.markdownContent).contain("No test report were found");
  });
});
