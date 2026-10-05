import { describe, expect, it, vi } from "vitest";
import { findLatestWorkflowRun, toWorkflowRunResult } from "./github-api";

function run(id: number, head_branch: string, status = "completed", conclusion: string | null = "success") {
  return {
    id,
    name: "Pre Release",
    head_branch,
    display_title: `chore(version): update to version '${head_branch}'`,
    status,
    conclusion,
    run_started_at: "2026-10-05T12:56:49Z",
    html_url: `https://github.com/kestra-io/kestra/actions/runs/${id}`,
  };
}

describe("findLatestWorkflowRun", () => {
  it("returns the branch-filtered run without a fallback call", async () => {
    const listRuns = vi.fn().mockResolvedValueOnce([run(1, "v2.0.5")]);

    const res = await findLatestWorkflowRun(listRuns, "v2.0.5");

    expect(res?.id).toEqual(1);
    expect(listRuns).toHaveBeenCalledTimes(1);
    expect(listRuns).toHaveBeenCalledWith({ branch: "v2.0.5", per_page: 1 });
  });

  it("falls back to the unfiltered listing when the branch filter returns nothing", async () => {
    // GitHub intermittently answers the branch-filtered listing with total_count: 0
    const listRuns = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([run(3, "v1.3.42"), run(2, "v2.0.5"), run(1, "v2.0.5")]);

    const res = await findLatestWorkflowRun(listRuns, "v2.0.5");

    expect(res?.id).toEqual(2);
    expect(listRuns).toHaveBeenNthCalledWith(2, { per_page: 100 });
  });

  it("returns undefined when no run exists for the branch", async () => {
    const listRuns = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([run(3, "v1.3.42")]);

    expect(await findLatestWorkflowRun(listRuns, "v2.0.5")).toBeUndefined();
  });
});

describe("toWorkflowRunResult", () => {
  it("maps a missing run to not_found instead of throwing", () => {
    expect(toWorkflowRunResult(undefined).status).toEqual("not_found");
  });

  it("maps run status and conclusion", () => {
    expect(toWorkflowRunResult(run(1, "b")).status).toEqual("success");
    expect(toWorkflowRunResult(run(1, "b", "completed", "neutral")).status).toEqual("success");
    expect(toWorkflowRunResult(run(1, "b", "completed", "failure")).status).toEqual("failure");
    expect(toWorkflowRunResult(run(1, "b", "in_progress", null)).status).toEqual("in_progress");
  });
});
