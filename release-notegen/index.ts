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

    console.log('context :: ', github.context);
    const newTag = github.context.ref.replace('refs/tags/', '');
    const workspaceName = newTag.split('/')[0];
    const newTagID: string = github.context.payload.after;
    const auth = core.getInput('repo-token', { required: true });

    const octokit = new Octokit({
        auth,
    });

    const tags = await getTags({
        // filter: `${newTag.split('-')[0]}-*`,
        filter: `${workspaceName}/prd/*`,
        orderBy: 'desc',
    });

    console.log('tags :: ', tags);
    const changelog = [];

    /**
     * latestTag가 undefined라면?
     * - 처음 만들어지는 태그라는 뜻
     * - new tag의 workspace name 정보로 apps/workspace-name 경로 아래 파일의 마지막 수정일 확인 후 그 일자부터 현재까지의 커밋
     * 목록을 가져와서 작업을 진행하게 한다.
     */
    const latestTag = tags[1]; // fe-monorepo에서는 0번?
    if (latestTag) {
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

        console.log('commits :: ', commits);

        const verifiedCommits = commits.data.commits.filter(commit => commit.commit.verification?.verified)
        const commitsByWorkspace = verifiedCommits.filter(commit => {
            const messageArray = commit.commit.message.split('\n');
            const labelsRow = messageArray.find(message => message.startsWith('labels: ')) || '';
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

        changelog.push(...[
            `${authors.length}명의 ✨빛나는✨ 버디즈가 기여해주신 덕분에 릴리즈 할 수 있었어요~ 감사합니다!`,
            ...changes,
            ``,
            `기여자: ${authors.map(author => `@${author}`).join(',')} 야 고마워!!\n`,
        ]);

        console.log('++++++++++++++++++++++++++++++');
        console.log(changelog.join('\n'))
        console.log('++++++++++++++++++++++++++++++');
    } else {
        changelog.push(...[
            `${workspaceName} 프로젝트의 첫 릴리즈입니다! 모두들 응원해주세요!`
        ]);
    }

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
