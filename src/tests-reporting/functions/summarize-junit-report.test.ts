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

  it("summarizeJunitReport should detect failures when suite attributes say failures>0 but testcases show success", async () => {
    // Simulates a suite-level failure (e.g. @BeforeAll crash) where Gradle writes
    // failures="1" on <testsuite> but the testcase itself has no <failure> element.
    const reports: TestReport[] = [
      {
        projectName: "jdbc-h2",
        projectReport: {
          errors: 0,
          skipped: 0,
          failures: 1,
          success: 0,
          status: "failed",
          tests: 1,
          time: 1,
          suites: 1,
          testsuites: [
            {
              name: "io.kestra.jdbc.SomeTest",
              errors: 0,
              skipped: 0,
              failures: 1,
              success: 0,
              status: "failed",
              tests: 1,
              time: 1,
              testcases: [
                {
                  // testcase parsed as success because tc.failure was falsy
                  name: "shouldDoSomething()",
                  classname: "io.kestra.jdbc.SomeTest",
                  time: 1,
                  status: "success",
                },
              ],
            },
          ],
        },
      },
    ];

    const res = summarizeJunitReport(reports, { onlyErrors: true });

    expect(res.hasErrors).equal(true);
    expect(res.markdownContent).contain("failed ❌");
    expect(res.markdownContent).contain("jdbc-h2");
  });

  it("summarizeJunitReport should show failing test name and message in details when testcase is failed", async () => {
    // Simulates a regular test failure (e.g. shouldResubmitTaskWhenWorkerIsStopped [1])
    // where the XML has a <failure> element and the testcase status is "failed".
    // Verifies that both the module-level detection AND the detail output work correctly.
    const reports: TestReport[] = [
      {
        projectName: "jdbc-mysql",
        projectReport: {
          errors: 0,
          skipped: 0,
          failures: 1,
          success: 1,
          status: "failed",
          tests: 2,
          time: 9,
          suites: 1,
          testsuites: [
            {
              name: "io.kestra.runner.mysql.MysqlServiceLivenessCoordinatorTest",
              errors: 0,
              skipped: 0,
              failures: 1,
              success: 1,
              status: "failed",
              tests: 2,
              time: 9,
              testcases: [
                {
                  name: "shouldResubmitTaskWhenWorkerIsStopped(String) [1] workerGroupKey=workerGroupKey",
                  classname: "io.kestra.runner.mysql.MysqlServiceLivenessCoordinatorTest",
                  time: 3,
                  status: "failed",
                  message: "java.lang.AssertionError: Expecting actual not to be null",
                  details: "at io.kestra.executor.AbstractServiceLivenessCoordinatorTest.shouldResubmitTaskWhenWorkerIsStopped(AbstractServiceLivenessCoordinatorTest.java:144)",
                },
                {
                  name: "shouldResubmitTaskWhenWorkerIsStopped(String) [2] workerGroupKey=<null>",
                  classname: "io.kestra.runner.mysql.MysqlServiceLivenessCoordinatorTest",
                  time: 6,
                  status: "success",
                },
              ],
            },
          ],
        },
      },
    ];

    const res = summarizeJunitReport(reports, { onlyErrors: true });

    expect(res.hasErrors).equal(true);
    expect(res.markdownContent).contain("failed ❌");
    expect(res.markdownContent).contain("jdbc-mysql");
    expect(res.markdownContent).contain("shouldResubmitTaskWhenWorkerIsStopped(String) [1] workerGroupKey=workerGroupKey");
    expect(res.markdownContent).contain("java.lang.AssertionError: Expecting actual not to be null");
    expect(res.markdownContent).contain("AbstractServiceLivenessCoordinatorTest.java:144");
    expect(res.markdownContent).not.contain("shouldResubmitTaskWhenWorkerIsStopped(String) [2] workerGroupKey=<null>");
  });

  it("summarizeJunitReport per-module failure count should reflect suite attributes, not testcase iteration", async () => {
    // Two XML files for the same project (outputPerTestCase=true produces one file per test).
    // Both have suite.failures=1 but testcases show status:"success".
    // After merging, the per-module row must show 2 failures, not 0.
    const file1: TestReport = {
      projectName: "jdbc-h2",
      projectReport: {
        errors: 0, skipped: 0, failures: 1, success: 0,
        status: "failed", tests: 1, time: 1, suites: 1,
        testsuites: [{
          name: "io.kestra.jdbc.QueryFilterTest",
          errors: 0, skipped: 0, failures: 1, success: 0,
          status: "failed", tests: 1, time: 1,
          testcases: [{ name: "shouldFilterByPrefix()", classname: "io.kestra.jdbc.QueryFilterTest", time: 1, status: "success" }],
        }],
      },
    };
    const file2: TestReport = {
      projectName: "jdbc-h2",
      projectReport: {
        errors: 0, skipped: 0, failures: 1, success: 0,
        status: "failed", tests: 1, time: 1, suites: 1,
        testsuites: [{
          name: "io.kestra.jdbc.QueryFilterTest",
          errors: 0, skipped: 0, failures: 1, success: 0,
          status: "failed", tests: 1, time: 1,
          testcases: [{ name: "shouldFilterByExact()", classname: "io.kestra.jdbc.QueryFilterTest", time: 1, status: "success" }],
        }],
      },
    };
    const file3: TestReport = {
      projectName: "jdbc-h2",
      projectReport: {
        errors: 0, skipped: 0, failures: 0, success: 1,
        status: "success", tests: 1, time: 1, suites: 1,
        testsuites: [{
          name: "io.kestra.jdbc.QueryFilterTest",
          errors: 0, skipped: 0, failures: 0, success: 1,
          status: "success", tests: 1, time: 1,
          testcases: [{ name: "shouldFilterByNamespace()", classname: "io.kestra.jdbc.QueryFilterTest", time: 1, status: "success" }],
        }],
      },
    };

    const res = summarizeJunitReport([file1, file2, file3], { onlyErrors: true });

    expect(res.hasErrors).equal(true);
    // Header total: failed: 2
    expect(res.markdownContent).contain("failed: 2");
    // Per-module row must show 2 in the Failed column, not 0
    expect(res.markdownContent).toMatch(/jdbc-h2.*failed ❌/);
  });

  it("summarizeJunitReport hasErrors should be false when all suite attributes report 0 failures", async () => {
    // when suite.failures=0 for all suites, hasErrors stays false
    // even if we have many merged reports.
    const reports: TestReport[] = [
      {
        projectName: "core",
        projectReport: {
          errors: 0, skipped: 1, failures: 0, success: 5,
          status: "success", tests: 6, time: 2, suites: 1,
          testsuites: [{
            name: "io.kestra.core.SomeTest",
            errors: 0, skipped: 1, failures: 0, success: 5,
            status: "success", tests: 6, time: 2,
            testcases: [
              { name: "test1()", classname: "io.kestra.core.SomeTest", time: 1, status: "success" },
              { name: "test2()", classname: "io.kestra.core.SomeTest", time: 1, status: "skipped" },
            ],
          }],
        },
      },
    ];

    const res = summarizeJunitReport(reports, { onlyErrors: true });

    expect(res.hasErrors).equal(false);
    expect(res.markdownContent).contain("success ✅");
  });
});
