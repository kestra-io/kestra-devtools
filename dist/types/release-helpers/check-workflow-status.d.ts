export declare function checkWorkflowStatus(githubToken: string, owner: string, repo: string, workflowId: string, branches: string[], options?: {
    retry: number | undefined;
    notify: boolean | undefined;
}): Promise<{
    output: string;
    status: 'success' | 'failure' | 'in_progress';
    triggeredRetries: {
        branch: string;
    }[];
}>;
