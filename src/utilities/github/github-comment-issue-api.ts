import { Octokit } from "octokit";

// from https://github.com/peter-evans/find-comment/blob/main/src/find.ts

export interface Inputs {
  issueNumber: number;
  commentAuthor?: string;
  bodyIncludes?: string;
  bodyRegex?: string;
  direction?: string;
  nth?: number;
}

interface InputsValidated {
  repository: string;
  issueNumber: number;
  commentAuthor?: string;
  bodyIncludes?: string;
  bodyRegex?: string;
  direction: string;
  nth: number;
}

export interface Comment {
  id: number;
  node_id: string;
  body?: string;
  user: {
    login: string;
  } | null;
  created_at: string;
}

function stringToRegex(s: string): RegExp {
  const m = s.match(/^(.)(.*?)\1([gimsuy]*)$/);
  if (m) return new RegExp(m[2], m[3]);
  else return new RegExp(s);
}

export function findCommentPredicate(inputs: InputsValidated, comment: Comment): boolean {
  return (
    (inputs.commentAuthor && comment.user ? comment.user.login === inputs.commentAuthor : true) &&
    (inputs.bodyIncludes && comment.body ? comment.body.includes(inputs.bodyIncludes) : true) &&
    (inputs.bodyRegex && comment.body
      ? comment.body.match(stringToRegex(inputs.bodyRegex)) !== null
      : true)
  );
}

export function findMatchingComment(inputs: InputsValidated, comments: Comment[]): Comment | undefined {
  if (inputs.direction == "last") {
    comments.reverse();
  }
  const matchingComments = comments.filter((comment) => findCommentPredicate(inputs, comment));
  const comment = matchingComments[inputs.nth];
  if (comment) {
    return comment;
  }
  return undefined;
}

export async function findComment(
  githubToken: string,
  owner: string,
  repository: string,
  inputs: Inputs,
): Promise<Comment | undefined> {
  const octokit = new Octokit({ auth: githubToken });
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner: owner,
    repo: repository,
    issue_number: inputs.issueNumber,
  });

  const inputValidated: InputsValidated = {
    ...inputs,
    repository,
    direction: inputs.direction ?? 'first',
    nth: inputs.nth ?? 0
  };
  return findMatchingComment(inputValidated, comments);
}
