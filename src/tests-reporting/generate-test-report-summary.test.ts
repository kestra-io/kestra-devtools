import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateTestReportSummary } from "./generate-test-report-summary";

const junitReport = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="io.kestra.core.validations.ScheduleValidationTest" tests="1" skipped="0" failures="0" errors="0" time="0.202">
  <testcase name="sundayDayOfTheWeekAlias()" classname="io.kestra.core.validations.ScheduleValidationTest" time="0.202"/>
</testsuite>
`;

function createTempWorkingDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "kestra-devtools-"));
}

function writeTestReport(workingDir: string): void {
    const reportDir = path.join(workingDir, "core", "build", "test-results", "test");
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(path.join(reportDir, "TEST-core.xml"), junitReport, "utf-8");
}

function writeDevelocityNdjson(workingDir: string, lines: string[]): void {
    const outputPath = path.join(workingDir, "develocity-scan-output.ndjson");
    fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf-8");
}

describe("generate-test-report-summary", () => {
    it("adds the first Develocity scan URI with a check task", async () => {
        const workingDir = createTempWorkingDir();
        writeTestReport(workingDir);
        writeDevelocityNdjson(workingDir, [
            JSON.stringify({
                taskNames: ["check"],
                buildScanUri: "https://develocity.example/scan-1",
            }),
            JSON.stringify({
                taskNames: ["test"],
                buildScanUri: "https://develocity.example/scan-2",
            }),
            JSON.stringify({
                taskNames: ["check", "test"],
                buildScanUri: "https://develocity.example/scan-3",
            }),
        ]);

        const result = await generateTestReportSummary(workingDir);

        expect(result.output).contains("Develocity build scan");
        expect(result.output).contains("https://develocity.example/scan-1");
        expect(result.output).not.contains("https://develocity.example/scan-3");
    });

    it("skips the Develocity section when no check task is found", async () => {
        const workingDir = createTempWorkingDir();
        writeTestReport(workingDir);
        writeDevelocityNdjson(workingDir, [
            JSON.stringify({
                taskNames: ["test"],
                buildScanUri: "https://develocity.example/scan-1",
            }),
        ]);

        const result = await generateTestReportSummary(workingDir);

        expect(result.output).not.contains("Develocity build scan");
        expect(result.output).not.contains("https://develocity.example/scan-1");
    });

    it("skips the Develocity section when the file is missing", async () => {
        const workingDir = createTempWorkingDir();
        writeTestReport(workingDir);

        const result = await generateTestReportSummary(workingDir);

        expect(result.output).not.contains("Develocity build scan");
    });
});
