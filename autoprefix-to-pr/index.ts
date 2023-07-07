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

    const updatedFiles = (await getUpdatedFiles({
        // @ts-ignore
        to: github.context.payload.pull_request.head.sha,
        // @ts-ignore
        from: github.context.payload.pull_request.base.sha,
    })).filter(Boolean);
    console.log('updatedFiles :: ', updatedFiles);
    const labels = updatedFiles.map(file => file.split('/')[1].split('.')[0]);

    // const header = ['### 변경된 프로젝트\r\n', labels.join(','), ''];
    const header = [
        '----------\n', 
        '_이 영역을 변경하지 마세요. 릴리즈 노트 생성을 위한 영역입니다._\n\n',
        '### 변경된 프로젝트\n\n',
        `labels: ${labels.join(',')}`,
        '\n\n----------'
    ];

    await octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: pullNumber,
        title: `${title} [test-suffix]`,
        body: `${header.join('')}\n\n${body}`,
    });

    console.log('Succed executed');
}

(async () => {
    await solution()
})();
