import { listWorkflowRuns } from "../github-api";

export async function checkWorkflowStatus(
  githubToken: string,
  owner: string,
  repo: string,
  workflowId: string,
  branches: string[],
): Promise<{output: string, failed: boolean}> {
  if (!branches || branches.length === 0) {
    throw Error("checkWorkflowStatus: at least one branch is required");
  }

  let strOutput = `Checking status for workflow ${workflowId} on branches: ${branches} for owner: ${owner} and repo: ${repo}\n`;
  let hasFailed = false;
  for (const branch of branches) {
    const workflowRes = await listWorkflowRuns(githubToken, owner, repo, workflowId, branch);
    strOutput = strOutput.concat(
      `\n${branch} > ${statusToIcon(workflowRes.status)} \n\t id: ${workflowRes.runId} \n\t name: ${workflowRes.name} \n\t commit: ${workflowRes.commitText} \n\t startDate: ${workflowRes.runStartDate} \n\t url: ${workflowRes.url}\n`,
    );
    if(workflowRes.status === 'failure'){
      hasFailed = true;
    }
  }
  return {output: strOutput, failed: hasFailed};
}

function statusToIcon(status: string): string {
  if (status === "success") {
    return `${status} ✅`;
  }
  if (status === "failure") {
    return `${status} ❌`;
  }
  if (status === "in_progress") {
    return `${status} ⏳`;
  }
  return status;
}
