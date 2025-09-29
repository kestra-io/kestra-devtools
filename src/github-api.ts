import { Octokit } from "octokit";

export async function commentPR(
  githubToken: string,
  owner: string,
  repo: string,
  prNumber: number,
  content: string,
) {
  const octokit = new Octokit({ auth: githubToken });

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: content,
  });
}

export async function listWorkflowRuns(
  githubToken: string,
  owner: string,
  repo: string,
  workflowId: string,
  branch: string,
): Promise<{
  runId: number;
  name: string | null;
  commitText: string;
  status: string;
  runStartDate: string | undefined;
  url: string;
}> {
  const octokit = new Octokit({ auth: githubToken });

  const list = await octokit.rest.actions.listWorkflowRuns({
    owner,
    repo,
    branch,
    workflow_id: workflowId,
    per_page: 1,
  });
  if (list.data.total_count === 0) {
    console.error(
      `No run found for owner: ${owner} repo: ${repo}, workflow: ${workflowId}, branch: ${branch}`,
    );
  }
  const last = list.data.workflow_runs[0];
  let status: string;
  if (last.status === "completed") {
    if (last.conclusion === "success" || last.conclusion === "neutral") {
      status = "success";
    } else {
      status = "failure";
    }
  } else {
    status = "in_progress";
  }

  return {
    runId: last.id,
    name: last.name ?? null,
    commitText: last.display_title,
    status: status,
    runStartDate: last.run_started_at,
    url: last.html_url,
  };
}
