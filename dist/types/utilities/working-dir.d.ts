export type WorkingDir = string;
export declare function getDefaultWorkingDir(): WorkingDir;
/**
 * helper to handle working dir passed in CLI
 * @param workingDir by default the repository root
 */
export declare function validateWorkingDir(workingDir?: string): WorkingDir;
/**
 * helper to know if the CLI is run in Kestra OSS repo or EE, or not
 * @param workingDir
 */
export declare function inferKestraRepository(workingDir: WorkingDir): Promise<"kestra-oss" | "kestra-ee" | "unknown">;
