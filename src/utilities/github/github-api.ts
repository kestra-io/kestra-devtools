import { Octokit } from "octokit";
import { findComment } from "./github-comment-issue-api";

const kestraDevtoolCommentId = "comment_generated_with_https://github.com/kestra-io/kestra-devtools";

export async function commentPR(
  githubToken: string,
  owner: string,
  repo: string,
  prNumber: number,
  content: string,
) {
  const octokit = new Octokit({ auth: githubToken });

  // add a hidden id so we are able to search this comment
  content = `<!-- ${kestraDevtoolCommentId} -->\n${content}`;
  const previousComment = await findComment(githubToken, owner, repo, {
    issueNumber: prNumber,
    bodyIncludes: kestraDevtoolCommentId,
  });
  if (previousComment) {
    // update
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: previousComment.id,
      body: content,
    });
  } else {
    // create
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: content,
    });
  }
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

export async function reRunWorkflow(
  githubToken: string,
  owner: string,
  repo: string,
  workflowRunId: number,
) {
  const octokit = new Octokit({ auth: githubToken });
  await octokit.rest.actions.reRunWorkflow({
    owner,
    repo,
    run_id: workflowRunId,
  });
}
