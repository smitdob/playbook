# AI-SDLC Playbook Repository

This repository is the **single source of truth for all AI agent configurations, validation standards, communication protocols, and global governance rules** used in our AI-driven SDLC automation platform.

It is designed to be:

* simple for non-technical teams
* scalable for technical teams
* reusable across BA, Dev, QA, and DevOps
* production-ready for future orchestration

---

## 🚀 Objective

To build a **scalable, consistent, and production-ready multi-agent SDLC system** where every agent:

* has a clearly defined responsibility
* follows a strict 2-file standard
* communicates with predictable outputs
* supports human checkpoints
* supports self-healing retries
* can be orchestrated by master agents
* remains easy for BA and non-tech teams to use

---

## 📂 Repository Structure

```
Directory structure:
└── 1.0.0/
    ├── AGENTS.md
    ├── playbook/
    │   ├── agents/
    │   │   ├── CommonAgent/
    │   │   │   ├── HumanApprovalAgent/
    │   │   │   │   ├── Skills.md
    │   │   │   │   └── Validation.md
    │   │   │   ├── RAGContextAgent/
    │   │   │   │   ├── Skills.md
    │   │   │   │   └── Validation.md
    │   │   │   └── SelfHealingAgent/
    │   │   │       ├── Skills.md
    │   │   │       └── Validation.md
    │   │   ├── CoreAgent/
    │   │   │   ├── ArchitectureAgent/
    │   │   │   │   ├── Skills.md
    │   │   │   │   ├── subagents/
    │   │   │   │   └── Validation.md
    │   │   │   ├── DeveloperAgent/
    │   │   │   │   ├── Skills.md
    │   │   │   │   ├── subagents/
    │   │   │   │   │   └── BackendDeveloper/
    │   │   │   │   │       ├── Skills.md
    │   │   │   │   │       └── Validation.md
    │   │   │   │   └── Validation.md
    │   │   │   ├── DevOpsAgent/
    │   │   │   │   ├── Skills.md
    │   │   │   │   ├── subagents/
    │   │   │   │   └── Validation.md
    │   │   │   ├── QAAgent/
    │   │   │   │   ├── Skills.md
    │   │   │   │   └── Validation.md
    │   │   │   └── RequirementAgent/
    │   │   │       ├── Skills.md
    │   │   │       ├── subagents/
    │   │   │       └── Validation.md
    │   │   └── MasterAgent/
    │   │       └── OrchestratorAgent/
    │   │           ├── Skills.md
    │   │           └── Validation.md
    │   ├── communication/
    │   │   └── HandoffProtocol.md
    │   ├── global/
    │   │   ├── GlobalRules.md
    │   │   ├── ModelRoutingPolicy.md
    │   │   └── RagContextRules.md
    │   └── tools/
    │       ├── PlayWright.md
    │       └── RedMine.md
    └── README.md

```

## Agent Design Principle Section Update
Sub-agents can be added inside a parent agent using:
```
ParentAgent/
├── Skills.md
├── subagents/
│   └── ChildAgent/
│       ├── Skills.md
│       └── Validation.md
└── Validation.md
```


---

## 🧠 Architecture Overview

This system follows a **master-orchestrated SDLC pipeline flow**:

```text
User Requirement
      ↓
RequirementAgent
      ↓
HumanApprovalAgent
      ↓
ArchitectureAgent
      ↓
HumanApprovalAgent
      ↓
DeveloperAgent
      ↓
SelfHealingAgent
      ↓
QAAgent
      ↓
HumanApprovalAgent
      ↓
DevOpsAgent
      ↓
Done
```

The `OrchestratorAgent` manages:

* task sequencing
* retry routing
* approval checkpoints
* fallback escalation
* shared context injection

---

## 📁 Agent Design Principle

Every agent follows a **strict 2-file structure**:

```text
AgentName/
├── Skills.md
└── Validation.md
```

### ✅ `Skills.md`

Defines:

* system message
* role and responsibility
* skills
* model configuration
* input/output contracts
* tool usage
* escalation rules
* handoff expectations

### ✅ `Validation.md`

Defines:

* output validation rules
* schema checks
* retry conditions
* hallucination prevention
* confidence scoring
* human approval triggers
* fallback routing

---

## 🗂️ Mandatory Agent Standards

Every `Skills.md` must contain:

1. Agent Name
2. System Message
3. Skill Description
4. Model Configuration
5. Inputs
6. Outputs
7. Failure / Fallback Behavior

Every `Validation.md` must contain:

1. Validation Rules
2. Required Output Checks
3. Missing Input Behavior
4. Retry Conditions
5. Human Approval Trigger
6. Confidence / Quality Rules

---

## ⚠️ Important Governance Rules

### 1) Formatting Rules

* Use **Markdown only**
* ❌ Do NOT use YAML-style
* ✅ Always use bullet-based key/value formatting

Example:

```md
- **Model**: gpt-4.1
```

---

### 2) Naming Convention

Use **PascalCase** everywhere:

* Agent folders
* Agent names
* communication files
* global standards files
* tool definition files

✅ Correct:

* `RequirementAgent`
* `ModelFallbackPolicy.md`

❌ Wrong:

* `requirement-agent`
* `model_fallback_policy.md`

---

### 3) Model Configuration Rules

Always define:

* primary model
* fallback model
* retry escalation model
* temperature
* max tokens

Example:

```md
- **Primary Model**: gpt-4.1-mini
- **Fallback Model**: gpt-4.1
```

---

### 4) Failure Handling Rules

Agents must **never block the pipeline**.

Always:

* continue with assumptions OR
* return partial output OR
* route to SelfHealingAgent OR
* request HumanApprovalAgent

Clearly mark:

* assumptions
* confidence score
* missing inputs
* retry count

---

### 5) Sub-Agent Hierarchy Rules

If an agent contains sub-agents:

* parent `Skills.md` must define `## Sub-Agents`
* every sub-agent `Skills.md` must define `## Parent Agent`
* sub-agents must only handle delegated scoped tasks
* sub-agents must never bypass parent validation flow
* naming must follow PascalCase

Example:

```md id="a5mnj8"
## Sub-Agents
- BackendDeveloper
- FrontendDeveloper
```

Sub-agent example:

```md id="9j1v3p"
## Parent Agent
DeveloperAgent
```


## 🔗 Communication Standards

Located in:

```text
Playbook/Communication/HandoffProtocol.md
```

Defines:

* inter-agent contracts
* handoff schemas
* retry payloads
* escalation formats
* approval payload structures

---

## 🌍 Global Standards

Located in:

```text
Playbook/Global/
```

Includes:

* `GlobalRules.md`
* `ModelFallbackPolicy.md`
* `RagContextRules.md`

These govern:

* security
* model routing
* RAG injection standards
* retry limits
* organization-wide AI policies

---

## 🛠 Tool Integrations

Located in:

```text
Playbook/tools/
```

Examples:

* `PlayWright.md`
* `RedMine.md`

These define:

* Name
* Integration
* Purpose
* Actions
* When It Triggers
* Configuration

---

## 📌 Current Agent Types

### Core Agents

* RequirementAgent
* ArchitectureAgent
* DeveloperAgent
* QAAgent
* DevOpsAgent

### Common Agents

* HumanApprovalAgent
* RAGContextAgent
* SelfHealingAgent

### Master Agent

* OrchestratorAgent

---

## 🔮 Future Enhancements

* multi-model routing engine
* memory-based context injection
* JSON schema outputs
* dynamic sub-agent generation
* cost-aware model orchestration
* agent performance scoring

---
