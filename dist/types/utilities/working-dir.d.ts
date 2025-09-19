export type WorkingDir = string;
/**
 * helper to handle working dir passed in CLI
 * @param workingDir by default the repository root
 */
export declare function getWorkingDir(workingDir?: string): WorkingDir;
