import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';
import getTagID from './getTagID';
import getTags from './getTags';

const exec = promisify(childProcess.exec);

const solution1 = async () => {
    const { owner, repo } = github.context.repo;
    const pullRequest = github.context.payload.pull_request;

    if (!pullRequest) {
        console.warn('Pull request does not exists');
        return;
    }

    const title = pullRequest.title as string;
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

    const { data: mainBranch } = await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch: "main",
    });

    const mainCommitSHA = mainBranch.commit.sha;

    const { data: mainCommit } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: mainCommitSHA,
    });

    const commitMessage = mainCommit.message + "\n\nHELLO WORLD";
    console.log('mainCommit ::: ', mainCommit);
    const { data: newTree } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: mainCommit.tree.sha,
        tree: (mainCommit.tree as any).tree,
    });

    const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: commitMessage,
        tree: newTree.sha,
    });

    await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: "heads/main",
        sha: newCommit.sha,
        force: true,
    });

    
    // const tags = await getTags({
    //     filter: `${newTag.split('-')[0]}-*`,
    //     orderBy: 'desc',
    // });

    // console.log('tags :: ', tags);

    // const latestTag = tags[1];
    // const latestTagID = await getTagID(latestTag);

    // console.log('latestTag :: ', latestTag);
    // console.log('latestTagID :: ', latestTagID);
    // console.log('newTag :: ', newTag);
    // console.log('newTagID :: ', newTagID);

    // const timeline = octokit.paginate.iterator(
    //     octokit.repos.compareCommits.endpoint.merge({
    //         owner,
    //         repo,
    //         base: latestTagID.substring(0, 7),
    //         head: newTagID.substring(0, 7),
    //     })
    // );

    // const commitItems = [];
    // for await (const response of timeline) {
    //     const { data: compareCommits } = response;
    //     console.log('compareCommits :: ', compareCommits);
    // }

    // await octokit.rest.pulls.update({
    //     owner,
    //     repo,
    //     pull_number: pullNumber,
    //     title: `${title} [test-suffix]`,
    // });

    console.log('Succed executed');
}

const solution2 = async () => {
    const { owner, repo } = github.context.repo;
    const pullRequest = github.context.payload.pull_request;

    // if (!pullRequest) {
    //     console.warn('Pull request does not exists');
    //     return;
    // }

    // const title = pullRequest.title as string;
    // const pullNumber = pullRequest.number;
    console.log('payload :: ', github.context.payload);
    console.log('context :: ', github.context);

    console.log('Succed executed');
}

(async () => {
    await solution1()
})();
