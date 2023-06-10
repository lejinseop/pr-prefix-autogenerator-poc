import * as github from '@actions/github';

(() => {
    if (!github.context.payload.pull_request) {
        console.warn('Pull request does not exists');
    }

    console.log('pr :: ', github.context.payload.pull_request);

    console.log('Succed executed');
})();
