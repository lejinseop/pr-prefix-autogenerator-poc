import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { promisify } from 'util';
import childProcess from 'child_process';
import getTagID from './getTagID';
import getTags from './getTags';
import type { components as Components } from '@octokit/openapi-types';

const exec = promisify(childProcess.exec);

/**
 * tag push되면 실행
 * 새로 만들어진 태그...바로 직전 태그 사이 커밋 목록 가져오고
 * 그 커밋들에 연결된 pr의 라벨 가져와서
 * 태그에 해당하는 라벨 포함된 커밋만 추려서 release note 생성
 */
const solution = async () => {
    const { owner, repo } = github.context.repo;
    const pullRequest = github.context.payload.pull_request;
    console.log('owner :: ', owner);
    console.log('repo :: ', repo);

    console.log('context :: ', github.context);
    const newTag = github.context.ref.replace('refs/tags/', '');
    const workspaceName = newTag.split('/')[0];
    const newTagID: string = github.context.payload.after;
    console.log('workspaceName ::: ', workspaceName);
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
    const commitsByWorkspace = verifiedCommits.filter(commit => {
        const messageArray = commit.commit.message.split('\n');
        console.log('messageArray ::: ', messageArray);
        const labelsRow = messageArray.find(message => message.startsWith('labels: ')) || '';
        // const labels = (messageArray[3] || '').replace('\r', '').replace('\n', '').split(',');
        console.log('labelsRow ::: ', labelsRow);
        const labels = labelsRow.replace('\r', '').replace('\n', '').replace('labels: ', '').split(',');
        return labels.includes(workspaceName);
    });
    console.log('verifiedCommits ::: ', verifiedCommits);
    console.log('commitsByWorkspace ::: ', commitsByWorkspace);

    const authors = Array.from(new Set(commitsByWorkspace.map(commit => {
        return getAuthor(commit);
    })))

    const changes = commitsByWorkspace.map(commit => {
        const shortMessage = commit.commit.message.split('\n')[0];
        return `- ${shortMessage} @${getAuthor(commit)}`;
    });

    const changelog = [
        `${authors.length}명의 ✨빛나는✨ 기여자 분 ${authors.length > 1 ? '들' : ''} 덕분에 릴리즈 할 수 있었어요~ 감사합니다!`,
        ...changes,
        ``,
        `고마운 사람${authors.length > 1 ? '들' : ''}: ${authors.map(author => `@${author}`).join(',')} 야 고마워!!`
    ];

    console.log('++++++++++++++++++++++++++++++');
    console.log(changelog.join('\n'))
    console.log('++++++++++++++++++++++++++++++');

    await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: newTag,
        name: newTag,
        body: changelog.join('\n'),
    });

    console.log('Succed executed');
}


(async () => {
    await solution()
})();
