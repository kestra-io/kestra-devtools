export declare function checkWorkflowStatus(githubToken: string, owner: string, repo: string, workflowId: string, branches: string[]): Promise<{
    output: string;
    failed: boolean;
}>;
