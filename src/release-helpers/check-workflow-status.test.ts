import { describe, expect, it, Mock, vi } from "vitest";
// Import after mock so we get the mocked function value
import { listWorkflowRuns, reRunWorkflow } from "../github-api";
import { checkWorkflowStatus } from "./check-workflow-status";

// Mock the internal GitHub API module used by checkWorkflowStatus
vi.mock("../github-api", () => ({
  listWorkflowRuns: vi.fn(),
  reRunWorkflow: vi.fn(),
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
const runningWorkflowRunFixture = {
  runId: 18093664321,
  name: "Main workflow",
  commitText: "feat(core): push some backport running job",
  status: "in_progress",
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
  it("check with retry should trigger retry if workflow was failed", async () => {
    // Arrange: mock the internal call that fetches workflow runs
    const listWorkflowRunsMock = listWorkflowRuns as unknown as Mock;
    listWorkflowRunsMock.mockResolvedValue(failureWorkflowRunFixture);
    const reRunWorkflowMock = reRunWorkflow as unknown as Mock;
    reRunWorkflowMock.mockResolvedValue(Promise.resolve);

    const res = await checkWorkflowStatus(
      "fake-token",
      "kestra-io",
      "kestra-ee",
      "main-build.yml",
      ["branch1failed"],
      { retry: 1 },
    );

    expect(res.output).toBeDefined();
    expect(res.output).toContain("branch1failed > failure");
    expect(res.output).toContain("retrying branch1failed workflow");
    expect(res.triggeredRetries).length(1);
    expect(res.triggeredRetries[0].branch).toEqual('branch1failed');
  });
  it("check with retry should not trigger retry if workflow was success", async () => {
    // Arrange: mock the internal call that fetches workflow runs
    const listWorkflowRunsMock = listWorkflowRuns as unknown as Mock;
    listWorkflowRunsMock.mockResolvedValue(successWorkflowRunFixture);
    const reRunWorkflowMock = reRunWorkflow as unknown as Mock;
    reRunWorkflowMock.mockResolvedValue(Promise.resolve);

    const res = await checkWorkflowStatus(
      "fake-token",
      "kestra-io",
      "kestra-ee",
      "main-build.yml",
      ["branch1"],
      { retry: 1 },
    );

    expect(res.output).not.toContain("retrying branch1 workflow");
    expect(res.triggeredRetries).length(0);
  });
  it("check with retry should not trigger retry when workflow is already running", async () => {
    // Arrange: mock the internal call that fetches workflow runs
    const listWorkflowRunsMock = listWorkflowRuns as unknown as Mock;
    listWorkflowRunsMock.mockResolvedValue(runningWorkflowRunFixture);
    const reRunWorkflowMock = reRunWorkflow as unknown as Mock;
    reRunWorkflowMock.mockResolvedValue(Promise.resolve);

    const res = await checkWorkflowStatus(
      "fake-token",
      "kestra-io",
      "kestra-ee",
      "main-build.yml",
      ["branch1running"],
      { retry: 1 },
    );

    expect(res.output).toBeDefined();
    expect(res.output).toContain("branch1running > in_progress");
    expect(res.triggeredRetries).length(0);
  });
});
