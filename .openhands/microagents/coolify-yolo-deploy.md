---
name: Coolify YOLO Deploy
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers: []
---

# Coolify YOLO Deploy Microagent

This microagent handles deploying the application to Coolify at https://coolify.ai-ulu.com/ and running in yolo mode until deployment is successful.

## Task Description

When triggered, perform the following:

1. Navigate to the Coolify instance at https://coolify.ai-ulu.com/
2. Deploy the application to Coolify
3. Run in yolo mode (unattended, no confirmation prompts) 
4. Keep checking the deployment status until it succeeds
5. Do not stop until the deployment is successful

## Implementation Notes

- Use the browser or API to interact with Coolify
- If deployment fails, retry automatically
- Monitor deployment logs for success indicators
- The yolo mode typically means running deployment commands with `-y` or `--yes` flags to skip confirmation prompts
- Check for deployment completion status indicators (e.g., "Deployment successful", "Running", "Deployed")

## Credentials

May require authentication to Coolify. Check for available environment variables or credentials in the repository.
