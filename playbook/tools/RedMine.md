## Name
RedMine

## Integration

Used by: DeveloperAgent, OrchestratorAgent

## Purpose
Create and update Redmine tickets automatically during the pipeline.

## Actions
- Create new issue
- Update issue status
- Add comment to issue
- Link issues to each other

## When It Triggers
- After RequirementAgent completes: create BA ticket
- After ArchitectureAgent completes: create Architecture ticket
- After DeveloperAgent completes: create Development tickets
- After QAAgent completes: create QA tickets

## Configuration
- API endpoint: defined in environment variables
- Authentication: API key from environment variables
- Never hardcode credentials in this file