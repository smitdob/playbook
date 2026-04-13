"use strict";
// ── rules.ts — All validation rules from README.md ──────────────────────────
// Source: AI-SDLC Playbook README governance rules
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_PROJECT_CONTEXT = exports.YAML_STYLE_PATTERNS = exports.TOOLS_REQUIRED_SECTIONS = exports.VALIDATION_REQUIRED_SECTIONS = exports.MODEL_CONFIG_OPTIONAL_FIELDS = exports.MODEL_CONFIG_REQUIRED_FIELDS = exports.SKILLS_SUBAGENT_REQUIRED_SECTIONS = exports.SKILLS_REQUIRED_SECTIONS = exports.VALID_COMPLETION_SIGNALS = exports.KNOWN_MASTER_AGENTS = exports.KNOWN_COMMON_AGENTS = exports.KNOWN_CORE_AGENTS = exports.VALID_AGENT_CATEGORIES = exports.PASCAL_CASE_MD_REGEX = exports.PASCAL_CASE_AGENT_REGEX = exports.PASCAL_CASE_REGEX = void 0;
// ── Naming conventions ───────────────────────────────────────────────────────
exports.PASCAL_CASE_REGEX = /^[A-Z][a-zA-Z0-9]+$/;
exports.PASCAL_CASE_AGENT_REGEX = /^[A-Z][a-zA-Z0-9]+Agent$/;
exports.PASCAL_CASE_MD_REGEX = /^[A-Z][a-zA-Z0-9]+\.md$/;
// Valid top-level agent categories (from README structure)
exports.VALID_AGENT_CATEGORIES = ['CoreAgent', 'CommonAgent', 'MasterAgent'];
// Valid known agent names (expandable)
exports.KNOWN_CORE_AGENTS = [
    'RequirementAgent', 'ArchitectureAgent', 'DeveloperAgent', 'QAAgent', 'DevOpsAgent'
];
exports.KNOWN_COMMON_AGENTS = [
    'HumanApprovalAgent', 'SelfHealingAgent', 'RAGContextAgent'
];
exports.KNOWN_MASTER_AGENTS = ['OrchestratorAgent'];
// Valid completion signals
exports.VALID_COMPLETION_SIGNALS = [
    'REQUIREMENT_DONE', 'ARCHITECTURE_DONE', 'DEVELOPER_DONE',
    'QA_DONE', 'DEVOPS_DONE', 'HEALED', 'ESCALATED',
    'RAG_DONE', 'APPROVAL_PENDING', 'PIPELINE_COMPLETE', 'PIPELINE_FAILED'
];
// ── Skills.md required sections (from README Mandatory Agent Standards) ──────
exports.SKILLS_REQUIRED_SECTIONS = [
    '## Agent Name',
    '## System Message',
    '## Skill Description',
    '## Model Configuration',
    '## Inputs',
    '## Outputs',
    '## Failure / Fallback Behavior',
];
// Required for sub-agents only
exports.SKILLS_SUBAGENT_REQUIRED_SECTIONS = [
    '## Parent Agent',
];
// Model config required fields (README Rule 3: Model Configuration Rules)
exports.MODEL_CONFIG_REQUIRED_FIELDS = [
    '**Primary Model**',
    '**Fallback Model**',
    '**Temperature**',
];
exports.MODEL_CONFIG_OPTIONAL_FIELDS = [
    '**Max Tokens**',
    '**Default Tokens**',
];
// ── Validation.md required sections (from README Mandatory Agent Standards) ──
exports.VALIDATION_REQUIRED_SECTIONS = [
    '## Agent Name',
    '## Validation Version',
    '## Purpose',
    '## MUST PASS',
    '## QUALITY CHECKS',
    '## Self-Healing Rules',
    '## Human Approval Gate',
];
// ── Tools required sections (from README Tool Integrations) ──────────────────
exports.TOOLS_REQUIRED_SECTIONS = [
    '## Name',
    '## Integration',
    '## Purpose',
    '## Actions',
    '## When It Triggers',
    '## Configuration',
];
// ── Formatting rules (README Rule 1) ────────────────────────────────────────
// YAML-style patterns that should NOT appear
exports.YAML_STYLE_PATTERNS = [
    /^[a-zA-Z][a-zA-Z0-9_]+:\s+\S/m, // key: value (not inside code block)
];
// ── AI Assistant context (used in Phase 2) ───────────────────────────────────
exports.AI_PROJECT_CONTEXT = `
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
