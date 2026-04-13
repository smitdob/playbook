// ── rules.ts — All validation rules from README.md ──────────────────────────
// Source: AI-SDLC Playbook README governance rules

// ── Naming conventions ───────────────────────────────────────────────────────

export const PASCAL_CASE_REGEX = /^[A-Z][a-zA-Z0-9]+$/;
export const PASCAL_CASE_AGENT_REGEX = /^[A-Z][a-zA-Z0-9]+Agent$/;
export const PASCAL_CASE_MD_REGEX = /^[A-Z][a-zA-Z0-9]+\.md$/;

// Valid top-level agent categories (from README structure)
export const VALID_AGENT_CATEGORIES = ['CoreAgent', 'CommonAgent', 'MasterAgent'];

// Valid known agent names (expandable)
export const KNOWN_CORE_AGENTS = [
  'RequirementAgent', 'ArchitectureAgent', 'DeveloperAgent', 'QAAgent', 'DevOpsAgent'
];
export const KNOWN_COMMON_AGENTS = [
  'HumanApprovalAgent', 'SelfHealingAgent', 'RAGContextAgent'
];
export const KNOWN_MASTER_AGENTS = ['OrchestratorAgent'];

// Valid completion signals
export const VALID_COMPLETION_SIGNALS = [
  'REQUIREMENT_DONE', 'ARCHITECTURE_DONE', 'DEVELOPER_DONE',
  'QA_DONE', 'DEVOPS_DONE', 'HEALED', 'ESCALATED',
  'RAG_DONE', 'APPROVAL_PENDING', 'PIPELINE_COMPLETE', 'PIPELINE_FAILED'
];

// ── Skills.md required sections (from README Mandatory Agent Standards) ──────
export const SKILLS_REQUIRED_SECTIONS: string[] = [
  '## Agent Name',
  '## System Message',
  '## Skill Description',
  '## Model Configuration',
  '## Inputs',
  '## Outputs',
  '## Failure / Fallback Behavior',
];

// Required for sub-agents only
export const SKILLS_SUBAGENT_REQUIRED_SECTIONS: string[] = [
  '## Parent Agent',
];

// Model config required fields (README Rule 3: Model Configuration Rules)
export const MODEL_CONFIG_REQUIRED_FIELDS: string[] = [
  '**Primary Model**',
  '**Fallback Model**',
  '**Temperature**',
];

export const MODEL_CONFIG_OPTIONAL_FIELDS: string[] = [
  '**Max Tokens**',
  '**Default Tokens**',
];

// ── Validation.md required sections (from README Mandatory Agent Standards) ──
export const VALIDATION_REQUIRED_SECTIONS: string[] = [
  '## Agent Name',
  '## Validation Version',
  '## Purpose',
  '## MUST PASS',
  '## QUALITY CHECKS',
  '## Self-Healing Rules',
  '## Human Approval Gate',
];

// ── Tools required sections (from README Tool Integrations) ──────────────────
export const TOOLS_REQUIRED_SECTIONS: string[] = [
  '## Name',
  '## Integration',
  '## Purpose',
  '## Actions',
  '## When It Triggers',
  '## Configuration',
];

// ── Formatting rules (README Rule 1) ────────────────────────────────────────
// YAML-style patterns that should NOT appear
export const YAML_STYLE_PATTERNS: RegExp[] = [
  /^[a-zA-Z][a-zA-Z0-9_]+:\s+\S/m,   // key: value (not inside code block)
];

// ── AI Assistant context (used in Phase 2) ───────────────────────────────────
export const AI_PROJECT_CONTEXT = `
You are an expert AI Agent Playbook Assistant for the AI-SDLC automation platform.

PROJECT CONTEXT:
This is a multi-agent SDLC automation system where AI agents automate the software development lifecycle.
The system has these agent categories:
- CoreAgent: RequirementAgent, ArchitectureAgent, DeveloperAgent, QAAgent, DevOpsAgent
- MasterAgent: OrchestratorAgent (manages pipeline)
- CommonAgent: HumanApprovalAgent, SelfHealingAgent, RAGContextAgent (reusable helpers)

MANDATORY RULES:
1. Every agent folder must have exactly 2 files: Skills.md and Validation.md
2. All names use PascalCase (e.g., RequirementAgent, not requirement-agent)
3. Sub-agents live in a subagents/ folder inside the parent agent
4. Sub-agents must define ## Parent Agent section
5. Parent agents must define ## Sub-Agents section if they have sub-agents
6. Model config must include Primary Model, Fallback Model, Temperature
7. Use "- **Key**: value" format — never YAML style
8. Every agent must have a completion signal (e.g., REQUIREMENT_DONE)
9. Agents must never block the pipeline — always provide partial output or fallback

SKILLS.MD REQUIRED SECTIONS:
## Agent Name, ## System Message, ## Skill Description, ## Model Configuration,
## Inputs, ## Outputs, ## Failure / Fallback Behavior
(Sub-agents also need: ## Parent Agent)

VALIDATION.MD REQUIRED SECTIONS:
## Agent Name, ## Validation Version, ## Purpose, ## MUST PASS,
## QUALITY CHECKS, ## Self-Healing Rules, ## Human Approval Gate

PIPELINE FLOW:
User Requirement → RequirementAgent → [HumanApproval] → ArchitectureAgent → [HumanApproval]
→ DeveloperAgent → [SelfHealing] → QAAgent → [HumanApproval] → DevOpsAgent → Done

The OrchestratorAgent manages the pipeline. RAGContextAgent injects SOPs before each agent runs.
`;
