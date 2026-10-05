export declare const GITHUB_PR_COMMENT_MAX_CHARACTERS = 65536;
export declare function commentPR(githubToken: string, owner: string, repo: string, prNumber: number, content: string): Promise<void>;
export type WorkflowRunStatus = "success" | "failure" | "in_progress" | "not_found";
export type WorkflowRunResult = {
    runId: number | undefined;
    name: string | null;
    commitText: string | undefined;
    status: WorkflowRunStatus;
    runStartDate: string | undefined;
    url: string | undefined;
};
type WorkflowRun = {
    id: number;
    name?: string | null;
    head_branch: string | null;
    display_title: string;
    status: string | null;
    conclusion: string | null;
    run_started_at?: string;
    html_url: string;
};
/**
 * Finds the latest run of a workflow on a branch.
 *
 * GitHub's `branch`-filtered run listing is not consistent: the same request
 * alternates between returning the run and `total_count: 0`, sometimes for
 * hours (kestra-io/kestra-devtools#38). So when the filtered listing comes back
 * empty, the recent runs are listed unfiltered and matched on `head_branch`
 * here. Runs are returned newest first, so the first match is the latest.
 */
export declare function findLatestWorkflowRun(listRuns: (params: {
    branch?: string;
    per_page: number;
}) => Promise<WorkflowRun[]>, branch: string): Promise<WorkflowRun | undefined>;
export declare function toWorkflowRunResult(run: WorkflowRun | undefined): WorkflowRunResult;
export declare function listWorkflowRuns(githubToken: string, owner: string, repo: string, workflowId: string, branch: string): Promise<WorkflowRunResult>;
export declare function reRunWorkflow(githubToken: string, owner: string, repo: string, workflowRunId: number): Promise<void>;
export {};
