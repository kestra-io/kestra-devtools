import { describe, expect, it, vi, Mock } from "vitest";

// Mock the internal GitHub API module used by checkWorkflowStatus
vi.mock("../github-api", () => ({
  listWorkflowRuns: vi.fn(),
}));

// Import after mock so we get the mocked function value
import { listWorkflowRuns } from "../github-api";
import { checkWorkflowStatus } from "./check-workflow-status";

const successWorkflowRunFixture = {
  runId: 18093664321,
  name: "Main workflow",
  commitText: "feat(core): push some backport",
  status: "success",
  runStartDate: "2025-09-29T10:20:03Z",
  url: "https://github.com/kestra-io/kestra-ee/actions/runs/18093664321",
};

describe("check-workflow-status test", () => {
  it("parse OK for all tests success", async () => {
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

    expect(res).toBeDefined();
    expect(res).toContain('branch1 > success');
    expect(res).toContain('branch2 > success');
    expect(res).toContain(18093664321);
  });
});
