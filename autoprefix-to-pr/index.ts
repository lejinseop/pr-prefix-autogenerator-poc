import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';

const exec = promisify(childProcess.exec);

const getUpdatedFiles = async ({
    from,
    to,
}: {
    from: string;
    to: string;
}): Promise<string[]> => {
    const { stdout } = await exec(
        ['git', '-c', 'core.quotepath=false', 'diff', '--name-only', `${from}...${to}`].join(' '),
    );

    return stdout.split('\n');
};

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

    const auth = core.getInput('repo-token', { required: true });

    const octokit = new Octokit({
        auth,
    });

    const labels = ['label1', 'label2', 'label3'];
    // const changes = await getUpdatedFiles({
    //     to: github.context.payload.pull_request.
    // })

    const footer = ['---------------------------\r\n',labels.join(',')]

    await octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: pullNumber,
        title: `${title} [test-suffix]`,
        body: `${body}\r\n${footer.join('')}`,
    });

    console.log('Succed executed');
}

(async () => {
    await solution()
})();
