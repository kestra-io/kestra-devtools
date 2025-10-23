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
export declare function findCommentPredicate(inputs: InputsValidated, comment: Comment): boolean;
export declare function findMatchingComment(inputs: InputsValidated, comments: Comment[]): Comment | undefined;
export declare function findComment(githubToken: string, owner: string, repository: string, inputs: Inputs): Promise<Comment | undefined>;
export {};
