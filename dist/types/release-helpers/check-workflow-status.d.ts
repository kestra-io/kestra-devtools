export declare function checkWorkflowStatus(githubToken: string, owner: string, repo: string, workflowId: string, branches: string[], options?: {
    retry: number | undefined;
}): Promise<{
    output: string;
    failed: boolean;
    triggeredRetries: {
        branch: string;
    }[];
}>;
