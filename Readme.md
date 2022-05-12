
```yaml
steps:
- uses: abhinav-singh-vineti/pr-format-rules@master
  with:
    jira-api-token: #{{ secrets.token }}
    jira-user-email: #User email used to access the JIRA REST API
    jira-base-url: #The subdomain of JIRA cloud
    github_token: ${{ github.token }} # Default: ${{ github.token }}
```