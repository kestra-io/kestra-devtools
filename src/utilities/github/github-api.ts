import { Octokit } from "octokit";
import { findComment } from "./github-comment-issue-api";

const kestraDevtoolCommentId = "comment_generated_with_https://github.com/kestra-io/kestra-devtools";

export const GITHUB_PR_COMMENT_MAX_CHARACTERS = 65536;

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
  if(content.length >= GITHUB_PR_COMMENT_MAX_CHARACTERS){
    const trimFootNote = `\n\n---\n\`\`\`\n</details>\n\n> [!CAUTION]\n> content was trimmed to not exceed Github max number of characters: ${GITHUB_PR_COMMENT_MAX_CHARACTERS} [^1].`;
    content = content.substring(0, GITHUB_PR_COMMENT_MAX_CHARACTERS - trimFootNote.length) + trimFootNote;
  }
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

export type WorkflowRunStatus = "success" | "failure" | "in_progress" | "not_found";

export type WorkflowRunResult = {
  runId: number | undefined;
  name: string | null;
  commitText: string | undefined;
  status: WorkflowRunStatus;
  runStartDate: string | undefined;
  url: string | undefined;
};

type WorkflowRun = {
  id: number;
  name?: string | null;
  head_branch: string | null;
  display_title: string;
  status: string | null;
  conclusion: string | null;
  run_started_at?: string;
  html_url: string;
};

// how many recent runs the unfiltered fallback scans for the branch
const UNFILTERED_FALLBACK_PAGE_SIZE = 100;

/**
 * Finds the latest run of a workflow on a branch.
 *
 * GitHub's `branch`-filtered run listing is not consistent: the same request
 * alternates between returning the run and `total_count: 0`, sometimes for
 * hours (kestra-io/kestra-devtools#38). So when the filtered listing comes back
 * empty, the recent runs are listed unfiltered and matched on `head_branch`
 * here. Runs are returned newest first, so the first match is the latest.
 */
export async function findLatestWorkflowRun(
  listRuns: (params: { branch?: string; per_page: number }) => Promise<WorkflowRun[]>,
  branch: string,
): Promise<WorkflowRun | undefined> {
  const filtered = await listRuns({ branch, per_page: 1 });
  if (filtered.length > 0) {
    return filtered[0];
  }
  const recent = await listRuns({ per_page: UNFILTERED_FALLBACK_PAGE_SIZE });
  return recent.find((run) => run.head_branch === branch);
}

export function toWorkflowRunResult(run: WorkflowRun | undefined): WorkflowRunResult {
  if (!run) {
    return {
      runId: undefined,
      name: null,
      commitText: undefined,
      status: "not_found",
      runStartDate: undefined,
      url: undefined,
    };
  }
  let status: WorkflowRunStatus;
  if (run.status === "completed") {
    if (run.conclusion === "success" || run.conclusion === "neutral") {
      status = "success";
    } else {
      status = "failure";
    }
  } else {
    status = "in_progress";
  }
  return {
    runId: run.id,
    name: run.name ?? null,
    commitText: run.display_title,
    status: status,
    runStartDate: run.run_started_at,
    url: run.html_url,
  };
}

export async function listWorkflowRuns(
  githubToken: string,
  owner: string,
  repo: string,
  workflowId: string,
  branch: string,
): Promise<WorkflowRunResult> {
  const octokit = new Octokit({ auth: githubToken });

  const run = await findLatestWorkflowRun(async (params) => {
    const list = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowId,
      ...params,
    });
    return list.data.workflow_runs;
  }, branch);
  if (!run) {
    console.error(
      `No run found for owner: ${owner} repo: ${repo}, workflow: ${workflowId}, branch: ${branch}`,
    );
  }
  return toWorkflowRunResult(run);
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
