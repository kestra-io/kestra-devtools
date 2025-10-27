import fs from "fs";
import path from "path";

export type WorkingDir = string;


export function getDefaultWorkingDir(): WorkingDir {
  return validateWorkingDir(process.cwd());
}

/**
 * helper to handle working dir passed in CLI
 * @param workingDir by default the repository root
 */
export function validateWorkingDir(workingDir?: string): WorkingDir {
  if (!workingDir) {
    throw new Error("an absolute working dir is for required, this can be improved for better DX");
  }
  if (!path.isAbsolute(workingDir)) {
    throw new Error(`Working directory must be an absolute path: ${workingDir}`);
  }

  if (!fs.existsSync(workingDir)) {
    throw new Error(`Working directory does not exist: ${workingDir}`);
  }

  const stat = fs.statSync(workingDir);
  if (!stat.isDirectory()) {
    throw new Error(`Working directory is not a directory: ${workingDir}`);
  }

  return workingDir;
}

/**
 * helper to know if the CLI is run in Kestra OSS repo or EE, or not
 * @param workingDir
 */
export async function inferKestraRepository(
  workingDir: WorkingDir,
): Promise<"kestra-oss" | "kestra-ee" | "unknown"> {
  if (process.env.GITHUB_REPOSITORY === "kestra-io/kestra-ee") {
    return "kestra-ee";
  } else if (process.env.GITHUB_REPOSITORY === "kestra-io/kestra") {
    return "kestra-oss";
  } else if (workingDir.endsWith("kestra-ee")) {
    return "kestra-ee";
  } else if (workingDir.endsWith("kestra")) {
    return "kestra-oss";
  } else {
    return "unknown";
  }
}