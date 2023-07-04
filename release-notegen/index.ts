import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';
import getTagID from './getTagID';
import getTags from './getTags';

const exec = promisify(childProcess.exec);

/**
 * tag push되면 실행
 * 새로 만들어진 태그...바로 직전 태그 사이 커밋 목록 가져오고
 * 그 커밋들에 연결된 pr의 라벨 가져와서
 * 태그에 해당하는 라벨 포함된 커밋만 추려서 release note 생성
 */
const solution1 = async () => {
    const { owner, repo } = github.context.repo;
    const pullRequest = github.context.payload.pull_request;
    console.log('owner :: ', owner);
    console.log('repo :: ', repo);

    console.log('context :: ', github.context);
    const newTag = github.context.ref.replace('refs/tags/', '');
    const newTagID: string = github.context.payload.after;

    const auth = core.getInput('repo-token', { required: true });

    const octokit = new Octokit({
        auth,
    });

    const tags = await getTags({
        filter: `${newTag.split('-')[0]}-*`,
        orderBy: 'desc',
    });

    console.log('tags :: ', tags);

    const latestTag = tags[1];
    const latestTagID = await getTagID(latestTag);

    console.log('latestTag :: ', latestTag);
    console.log('latestTagID :: ', latestTagID);
    console.log('newTag :: ', newTag);
    console.log('newTagID :: ', newTagID);

    const timeline = octokit.paginate.iterator(
        octokit.repos.compareCommits.endpoint.merge({
            owner,
            repo,
            base: latestTagID.substring(0, 7),
            head: newTagID.substring(0, 7),
        })
    );

    const commits = await octokit.repos.compareCommits({
        owner,
        repo,
        base: latestTagID.substring(0, 7),
        head: newTagID.substring(0, 7),
    });

    for (const commit of commits.data.commits) {
        console.log('commit :: ', commit);
    }

    // interface Commit {
    //     sha: string;
    //     node_id: string;
    //     commit: {
    //         author: object;
    //         message: string;
    //         verification: object;
    //     }
    //     author: {
    //         login: string;
    //     }
    // }

    // const commitItems = [];
    // for await (const response of timeline) {
    //     const { data: compareCommits } = response;
    //     console.log('compareCommits :: ', compareCommits);
    //     // @ts-ignore
    //     commitItems.push(...compareCommits.commits)
    // }
    // console.log('commitItems ::: ', commitItems);

    

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

    console.log('context :: ', github.context);
    const newTag = github.context.ref.replace('refs/tags/', '');
    const newTagID: string = github.context.payload.after;

    const auth = core.getInput('repo-token', { required: true });

    const octokit = new Octokit({
        auth,
    });

    const tags = await getTags({
        filter: `${newTag.split('-')[0]}-*`,
        orderBy: 'desc',
    });

    console.log('tags :: ', tags);

    const latestTag = tags[1];
    const latestTagID = await getTagID(latestTag);

    console.log('latestTag :: ', latestTag);
    console.log('latestTagID :: ', latestTagID);
    console.log('newTag :: ', newTag);
    console.log('newTagID :: ', newTagID);

    const timeline = octokit.paginate.iterator(
        octokit.repos.compareCommits.endpoint.merge({
            owner,
            repo,
            base: latestTagID.substring(0, 7),
            head: newTagID.substring(0, 7),
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
}

(async () => {
    await solution1()
})();
