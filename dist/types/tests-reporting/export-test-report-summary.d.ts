import { WorkingDir } from "../utilities/working-dir";
export declare function exportTestReportSummary(workingDir: WorkingDir, options?: {
    onlyErrors?: boolean;
    githubContext?: {
        token: string;
        owner: string;
        repo: string;
        prNumber: number;
    };
}): Promise<{
    output: string;
    status: 'success' | 'failure';
}>;
