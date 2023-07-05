import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';
import getTagID from './getTagID';
import getTags from './getTags';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { components as Components } from '@octokit/openapi-types';

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

    const getAuthor = (commit: Components['schemas']['commit']) => {
        if (!commit.author) {
            console.warn(
                `The author of the commit: ${commit.commit.tree.url} cannot be retrieved. Please add the github username manually.`,
            );
            return "TODO INSERT AUTHOR'S USERNAME";
        }
    
        return commit.author?.login;
    };

    const commits = await octokit.repos.compareCommits({
        owner,
        repo,
        base: latestTagID.substring(0, 7),
        head: newTagID.substring(0, 7),
    });

    const verifiedCommits = commits.data.commits.filter(commit => commit.commit.verification?.verified)
    
    for (const commit of verifiedCommits) {
        console.log('============================');
        console.log('sha       :: ', commit.sha);
        console.log('author    :: ', commit.author?.login);
        console.log('message   :: ', commit.commit.message);
        console.log('title     :: ', commit.commit.message.split('\r\n')[0]);
        console.log('message[] :: ', commit.commit.message.split('\r\n'));
        console.log('verified  :: ', commit.commit.verification?.verified);
    }
    console.log('============================');


    

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

    const changes = [''];

    const changelog = `
        {n}명의 ✨빛나는✨ 기여자들 덕분에 릴리즈 할 수 있었어요~ 감사합니다!

        ${changes.join('\n')}

        이 릴리즈의 모든 고마운 사람들: ... 야 고마워!!
    `

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

    // const timeline = octokit.paginate.iterator(
    //     octokit.repos.compareCommits.endpoint.merge({
    //         owner,
    //         repo,
    //         base: latestTagID.substring(0, 7),
    //         head: newTagID.substring(0, 7),
    //     })
    // );