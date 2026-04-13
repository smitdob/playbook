# Model Fallback Policy

Defines which model each agent uses and what happens when the primary model fails.


## Agent Model Assignment

RequirementAgent:
  PrimaryModel: llama-3.3-70b-versatile
  FallbackModel: gpt-4.1
  Temperature: 0.2
  DefaultTokens: 1200
  MaxTokens: 2000

ArchitectureAgent:
  PrimaryModel: llama-3.3-70b-versatile
  FallbackModel: gpt-4.1
  Temperature: 0.25
  DefaultTokens: 1500
  MaxTokens: 2500

DeveloperAgent:
  PrimaryModel: llama-3.3-70b-versatile
  FallbackModel: codestral-latest
  Temperature: 0.3
  DefaultTokens: 1800
  MaxTokens: 3000

QAAgent:
  PrimaryModel: llama-3.3-70b-versatile
  FallbackModel: gpt-4.1-mini
  Temperature: 0.2
  DefaultTokens: 1200
  MaxTokens: 2000

DevOpsAgent:
  PrimaryModel: llama-3.3-70b-versatile
  FallbackModel: gpt-4.1
  Temperature: 0.2
  DefaultTokens: 1500
  MaxTokens: 2200

OrchestratorAgent:
  PrimaryModel: llama-3.3-70b-versatile
  FallbackModel: gpt-4.1
  Temperature: 0.1
  DefaultTokens: 1000
  MaxTokens: 1800


## Fallback Rules
1. If primary model returns an error — automatically retry with fallback model
2. Maximum 2 retries on primary before switching to fallback
3. Maximum 1 retry on fallback before escalating to SelfHealingAgent
4. Always log which model was used in the agent output
5. Never silently fail — always surface the model used and retry count


## Token Usage Rules
DefaultTokens should be used for normal task execution
MaxTokens is the hard upper limit and must never be exceeded
If task complexity increases, token allocation may scale up to MaxTokens
Fallback model should reuse the same token allocation unless explicitly overridden
OrchestratorAgent can override token allocation based on workflow complexity

## Temperature Rules
Lower temperature (0.1 - 0.2) for deterministic workflow tasks
Medium temperature (0.25 - 0.3) for design and development creativity
Fallback model must use the same temperature unless a stronger reasoning mode is required
Any override must be logged in the agent response metadata

## Escalation Rules
If both models fail, route task to SelfHealingAgent
If retry count exceeds policy, escalate to HumanApprovalAgent
Escalation reason must include:
  failed model names
  retry count
  token usage
  failure summary