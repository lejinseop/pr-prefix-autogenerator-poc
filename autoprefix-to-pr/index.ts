import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';

const exec = promisify(childProcess.exec);

(async () => {
    const { owner, repo } = github.context.repo;
    const pullRequest = github.context.payload.pull_request;

    if (!pullRequest) {
        console.warn('Pull request does not exists');
        return;
    }

    const title = pullRequest.title as string;
    const pullNumber = pullRequest.number;
    console.log('pr :: ', github.context.payload.pull_request);

    const auth = core.getInput('repo-token', { required: true });
    console.log('auth :: ', auth);
    const octokit = new Octokit({
        auth,
    });

    await octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: pullNumber,
        title: `${title} [test-suffix]`,
    });

    console.log('Succed executed');
})();
