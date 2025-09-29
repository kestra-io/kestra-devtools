export declare function commentPR(githubToken: string, owner: string, repo: string, prNumber: number, content: string): Promise<void>;
export declare function listWorkflowRuns(githubToken: string, owner: string, repo: string, workflowId: string, branch: string): Promise<{
    runId: number;
    name: string | null;
    commitText: string;
    status: string;
    runStartDate: string | undefined;
    url: string;
}>;
