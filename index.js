const core = require('@actions/core');
const github = require('@actions/github');

const validEvent = ['pull_request'];

function validateTitlePrefix(title, prefix, caseSensitive) {
    if (!caseSensitive) {
        prefix = prefix.toLowerCase();
        title = title.toLowerCase();
    }
    return title.startsWith(prefix);
}

async function run() {
    try {
        const authToken = core.getInput('github_token', {required: true})
        const eventName = github.context.eventName;
        core.info(`Event name: ${eventName}`);
        if (validEvent.indexOf(eventName) < 0) {
            core.setFailed(`Invalid event: ${eventName}`);
            return;
        }

        const owner = github.context.payload.pull_request.base.user.login;
        const repo = github.context.payload.pull_request.base.repo.name;

        const client = new github.GitHub(authToken);

        const {data: pullRequest} = await client.pulls.get({
          owner,
          repo,
          pull_number: github.context.payload.pull_request.number
        });

        const title = pullRequest.title;
        const desc = pullRequest.body;

        core.info(`Pull Request title: "${title}"`);

        const rb2=/[a-zA-Z]-.+[0-9]/
        if (!rb2.test(title)){
            core.setFailed(`Pull Request title "${title}" failed to pass match regex - ${rb2} for description`);
            return
        }

        if (!rb2.test(desc)){
            core.setFailed(`Pull Request title "${desc}" failed to pass match regex - ${rb2} for description`);
            return
        }

        const minLen = parseInt(core.getInput('min_length'));
        if (title.length < minLen) {
            core.setFailed(`Pull Request title "${title}" is smaller than min length specified - ${minLen}`);
            return
        }

        const maxLen = parseInt(core.getInput('max_length'));
        if (maxLen > 0 && title.length > maxLen) {
            core.setFailed(`Pull Request title "${title}" is greater than max length specified - ${maxLen}`);
            return
        }

        let prefixes = core.getInput('allowed_prefixes');
        const prefixCaseSensitive = (core.getInput('prefix_case_sensitive') === 'true');
        core.info(`Allowed Prefixes: ${prefixes}`);
        if (prefixes.length > 0 && !prefixes.split(',').some((el) => validateTitlePrefix(title, el, prefixCaseSensitive))) {
            core.setFailed(`Pull Request title "${title}" did not match any of the prefixes - ${prefixes}`);
            return
        }

        prefixes = core.getInput('disallowed_prefixes');
        core.info(`Disallowed Prefixes: ${prefixes}`);
        if (prefixes.length > 0 && prefixes.split(',').some((el) => validateTitlePrefix(title, el, prefixCaseSensitive))) {
            core.setFailed(`Pull Request title "${title}" matched with a disallowed prefix - ${prefixes}`);
            return
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
