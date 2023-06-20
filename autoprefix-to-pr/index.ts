import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';
import getTagsFromRemote from './getTagsFromRemote';
import getTags from './getTags';

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
    console.log('ref :: ', github.context.ref);
    console.log('after ::: ', github.context.payload.after);
    const newTag = github.context.ref.replace('refs/tags/', '');
    const after = github.context.payload.after;
    console.log('====================================');
    console.log('pr :: ', github.context.payload.pull_request);

    const auth = core.getInput('repo-token', { required: true });
    console.log('auth :: ', auth);
    const octokit = new Octokit({
        auth,
    });

    // const tags = await getTagsFromRemote({
    //     filterBy: {},
    //     orderBy: {
    //         field: 'TAG_COMMIT_DATE',
    //         direction: 'DESC',
    //     },
    //     pagination: {
    //         pageSize: {
    //             first: 10
    //         }
    //     }
    // });
    const tags = await getTags({
        filter: `mini-web/prd*`,
        orderBy: 'desc',
    });

    const { stdout: tags2 } = await exec([`git`, `describe`, `--abbrev=0`, newTag].join(' '));

    console.log('tags :: ', tags);
    console.log('tags2 :: ', tags2);

    // await octokit.rest.pulls.update({
    //     owner,
    //     repo,
    //     pull_number: pullNumber,
    //     title: `${title} [test-suffix]`,
    // });

    console.log('Succed executed');
})();
