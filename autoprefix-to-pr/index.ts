import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';
import getTagID from './getTagID';
import getTags from './getTags';

const exec = promisify(childProcess.exec);

const solution = async () => {
    const { owner, repo } = github.context.repo;
    const pullRequest = github.context.payload.pull_request;

    if (!pullRequest) {
        console.warn('Pull request does not exists');
        return;
    }

    const title = pullRequest.title as string;
    const body = pullRequest.body || '';
    const pullNumber = pullRequest.number;
    const pullLabel: string[] = pullRequest.labels.map((label: any) => label.name);
    const mergeCommitID = pullRequest.merge_commit_sha;

    console.log('context :: ', github.context);
    console.log('=======================================');
    console.log('pr title :: ', title);
    console.log('pr nnumber :: ', pullNumber);
    console.log('pr label :: ', pullLabel);
    console.log('mergeCommitID :: ', mergeCommitID);
    console.log('=======================================');

    // const newTag = github.context.ref.replace('refs/tags/', '');
    // const newTagID: string = github.context.payload.after;

    const auth = core.getInput('repo-token', { required: true });

    const octokit = new Octokit({
        auth,
    });

    const labels = ['label1', 'label2', 'label3'];

    await octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: pullNumber,
        title: `${title} [test-suffix]`,
        body: `${body}\r\n${labels.join(',')}`,
    });

    console.log('Succed executed');
}

(async () => {
    await solution()
})();
