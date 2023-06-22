import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';

const exec = promisify(childProcess.exec);

(async () => {
    const { owner, repo } = github.context.repo;
    const pullRequest = github.context.payload.pull_request;

    // if (!pullRequest) {
    //     console.warn('Pull request does not exists');
    //     return;
    // }

    // const title = pullRequest.title as string;
    // const pullNumber = pullRequest.number;
    // console.log('payload :: ', github.context.payload);
    console.log('context :: ', github.context);
    const newTag = github.context.ref.replace('refs/tags/', '');
    const newTagID: string = github.context.payload.after;

    const auth = core.getInput('repo-token', { required: true });

    const octokit = new Octokit({
        auth,
    });
    console.log('newTag :: ', newTag);
    const { stdout: latestTagAndID } = await exec([`git`, `describe`, `--tags`, `${newTag}^`].join(' '));
    console.log('latestTagAndID ::: ', latestTagAndID)
    const regex = /^(.*)-(\w+)$/;
    const match = latestTagAndID.match(regex);

    if (!match) {
        return;
    }

    const latestTag = match[1];
    const latestTagID = match[2];

    console.log('latestTag :: ', latestTag);
    console.log('lastTagID :: ', latestTagID);
    console.log('newTag :: ', newTag);
    console.log('newTagID :: ', newTagID);

    const timeline = octokit.paginate.iterator(
        octokit.repos.compareCommits.endpoint.merge({
            owner,
            repo,
            base: latestTagID,
            head: newTagID,
        })
    );

    const commitItems = [];
    for await (const response of timeline) {
        const { data: compareCommits } = response;
        console.log('compareCommits :: ', compareCommits);
        // commitItems.push(...compareCommits.commits)
    }

    // await octokit.rest.pulls.update({
    //     owner,
    //     repo,
    //     pull_number: pullNumber,
    //     title: `${title} [test-suffix]`,
    // });

    console.log('Succed executed');
})();
