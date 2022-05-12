const core = require('@actions/core');
const github = require('@actions/github');
const JiraApi = require('jira-client')

const validEvent = ['pull_request'];

async function run() {
    try {
        const authToken = core.getInput('github_token', {required: true})
        const JIRA_USER_EMAIL = core.getInput('jira-user-email', { required: true });
        const JIRA_API_TOKEN = core.getInput('jira-api-token', { required: true });
        const JIRA_BASE_URL = core.getInput('jira-base-url', { required: true });
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

        core.info(`Pull Request Title: "${title}"`);

        const rx=/\[+[a-zA-Z]+-+[0-9]+\]/
        if (!rx.test(title)){
            core.setFailed(`Pull Request Title failed to match regex - ${rx} for title`);
            return
        }
        core.info(`Pull Request Description: "${desc}"`);
        
        if (!rx.test(desc)){
            core.setFailed(`Pull Request Description failed to match regex - ${rx} for description`);
            return
        }

        let jira = new JiraApi({
            protocol: 'https',
            host: JIRA_BASE_URL,
            username: JIRA_USER_EMAIL,
            password: JIRA_API_TOKEN,
            apiVersion: '2',
            strictSSL: true
        });
        const rx2=/[a-zA-Z]+-+[0-9]+/
        const match = title.match(rx2)
        const issueNumber = match ? match[0] : null

        if (!issueNumber) {
            return core.setFailed('No issue number found. Assuming not ready.');
        }
        core.info(issueNumber);
        jira.findIssue(issueNumber)
            .then(issue => {
                const statusFound = issue.fields.status.name;
                console.log(`Status: ${statusFound}`);
                core.setOutput("status", statusFound);
    
                if (statusFound !== "In Acceptance") {
                    core.setFailed(`Status must be "In Acceptance". Found "${statusFound}".`);
                }
            })
            .catch(err => {
                console.error(err);
                core.setFailed(error.message);
            });
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
