import { describe, expect, it, Mock, vi } from "vitest";
// Import after mock so we get the mocked function value
import { listWorkflowRuns } from "../github-api";
import { checkWorkflowStatus } from "./check-workflow-status";

// Mock the internal GitHub API module used by checkWorkflowStatus
vi.mock("../github-api", () => ({
  listWorkflowRuns: vi.fn(),
}));

const successWorkflowRunFixture = {
  runId: 18093664321,
  name: "Main workflow",
  commitText: "feat(core): push some backport",
  status: "success",
  runStartDate: "2025-09-29T10:20:03Z",
  url: "https://github.com/kestra-io/kestra-ee/actions/runs/18093664321",
};
const failureWorkflowRunFixture = {
  runId: 18093664321,
  name: "Main workflow",
  commitText: "feat(core): push some backport with error",
  status: "failure",
  runStartDate: "2025-09-29T10:20:03Z",
  url: "https://github.com/kestra-io/kestra-ee/actions/runs/18093664321",
};

describe("check-workflow-status test", () => {
  it("check ok for workflow in success", async () => {
    // Arrange: mock the internal call that fetches workflow runs
    const listWorkflowRunsMock = listWorkflowRuns as unknown as Mock;
    listWorkflowRunsMock.mockResolvedValue(successWorkflowRunFixture);

    const res = await checkWorkflowStatus(
      "fake-token",
      "kestra-io",
      "kestra-ee",
      "main-build.yml",
      ["branch1", "branch2"],
    );

    expect(res.output).toBeDefined();
    expect(res.output).toContain("branch1 > success");
    expect(res.output).toContain("branch2 > success");
    expect(res.failed).toEqual(false);
  });
  it("check not ok for workflow in failure", async () => {
    // Arrange: mock the internal call that fetches workflow runs
    const listWorkflowRunsMock = listWorkflowRuns as unknown as Mock;
    listWorkflowRunsMock.mockResolvedValue(failureWorkflowRunFixture);

    const res = await checkWorkflowStatus(
      "fake-token",
      "kestra-io",
      "kestra-ee",
      "main-build.yml",
      ["branch1failed"],
    );

    expect(res.output).toBeDefined();
    expect(res.output).toContain("branch1failed > failure");
    expect(res.failed).toEqual(true);
  });
});
