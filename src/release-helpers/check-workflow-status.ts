import { listWorkflowRuns, reRunWorkflow } from "../utilities/github/github-api";
import notifier from "node-notifier";

export async function checkWorkflowStatus(
  githubToken: string,
  owner: string,
  repo: string,
  workflowId: string,
  branches: string[],
  options?: {
    retry: number | undefined;
    notify: boolean | undefined;
  },
): Promise<{
  output: string;
  status: 'success' | 'failure' | 'in_progress';
  triggeredRetries: { branch: string }[];
}> {
  if (!branches || branches.length === 0) {
    throw Error("checkWorkflowStatus: at least one branch is required");
  }

  let strOutput = `Checking status for workflow ${workflowId} on branches: ${branches} for owner: ${owner} and repo: ${repo}\n`;
  let hasFailed = false;
  let anyStillRunning = false;
  const triggeredRetries: { branch: string }[] = [];

  for (const branch of branches) {
    const workflowRes = await listWorkflowRuns(githubToken, owner, repo, workflowId, branch);
    strOutput = strOutput.concat(
      `\n${branch} > ${statusToIcon(workflowRes.status)} \n\t id: ${workflowRes.runId} \n\t name: ${workflowRes.name} \n\t commit: ${workflowRes.commitText} \n\t startDate: ${workflowRes.runStartDate} \n\t url: ${workflowRes.url}\n`,
    );
    if (options?.notify) notifyEndedStatus(workflowRes);
    if (workflowRes.status === "failure") {
      hasFailed = true;

      if (options?.retry) {
        if (options.retry > 1) {
          throw Error("multiple retry not handled yet");
        }
        if (options.retry === 1) {
          strOutput = strOutput.concat(
            `\n\t♻️♻️♻️♻️♻️♻️♻️♻️♻️♻️♻️♻️\n\t\t retrying ${branch} workflow\n\t♻️♻️♻️♻️♻️♻️♻️♻️♻️♻️♻️♻️\n`,
          );
          await reRunWorkflow(githubToken, owner, repo, workflowRes.runId);
          triggeredRetries.push({ branch: branch });
        }
      }
    } else if(workflowRes.status === 'in_progress'){
        anyStillRunning = true;
    }
  }
  return { output: strOutput, status: hasFailed ? "failure":  anyStillRunning ? "in_progress" : "success", triggeredRetries: triggeredRetries };
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

function notifyEndedStatus(workflowRes: {
  runId?: number;
  name?: string | null;
  commitText?: string;
  status: string;
  runStartDate?: string | undefined;
  url?: string;
}): string {
  if (workflowRes.status === "success") {
    notifier.notify({
      title: "✅ Workflow Succeeded - " + workflowRes.name,
      message: "The workflow has completed successfully." + (workflowRes.url ? `\nDetails: ${workflowRes.url}` : ""),
      icon: undefined, // Optionally set a success icon path
    });
    return "Success notification sent.";
  }
  if (workflowRes.status === "failure") {
    notifier.notify({
      title: "❌ Workflow Failed - " + workflowRes.name,
      message: "The workflow has failed." + (workflowRes.url ? `\nDetails: ${workflowRes.url}` : ""),
      icon: undefined, // Optionally set a failure icon path
    });
    return "Failure notification sent.";
  }
  return "No notification sent.";
}
