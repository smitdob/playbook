# Master Agent Registry

Single source of truth for all agents in the AI-SDLC system.

---

## Core Agents — SDLC Pipeline

| Agent             | Role              | Checkpoint Label | Folder                        |
|-------------------|-------------------|-----------------|-------------------------------|
| RequirementAgent  | Business Analyst  | BA_APPROVAL     | Agents/CoreAgent/RequirementAgent  |
| ArchitectureAgent | System Architect  | ARCH_APPROVAL   | Agents/CoreAgent/ArchitectureAgent |
| DeveloperAgent    | Full Stack Dev    | DEV_APPROVAL    | Agents/CoreAgent/DeveloperAgent    |
| QAAgent           | QA Engineer       | QA_APPROVAL     | Agents/CoreAgent/QAAgent           |
| DevOpsAgent       | DevOps Engineer   | DEVOPS_APPROVAL | Agents/CoreAgent/DevOpsAgent       |

---

## Master Agent

| Agent              | Role             | Folder                         |
|--------------------|------------------|--------------------------------|
| OrchestratorAgent  | Pipeline Manager | Agents/MasterAgent/OrchestratorAgent|

---

## Common Agents — Reusable

| Agent              | Role                    | Folder                          |
|--------------------|-------------------------|---------------------------------|
| HumanApprovalAgent | Human checkpoint        | Agents/CommonAgent/HumanApprovalAgent|
| SelfHealingAgent   | Auto error correction   | Agents/CommonAgent/SelfHealingAgent  |
| RAGContextAgent    | Context injection       | Agents/CommonAgent/RAGContextAgent   |

---

## Pipeline Flow
```
OrchestratorAgent manages:

RequirementAgent → [BA_APPROVAL] → ArchitectureAgent → [ARCH_APPROVAL]
→ DeveloperAgent → [DEV_APPROVAL] → QAAgent → [QA_APPROVAL]
→ DevOpsAgent → [DEVOPS_APPROVAL] → DONE
```

---

## Adding a New Agent

1. Create folder under `Agents/CoreAgent/` or `Agents/CommonAgent/`
2. Add `Skills.md` — follow the standard format from any existing agent
3. Add `Validation.md` — define MUST PASS and QUALITY CHECKS
4. Register here in AGENTS.md
5. Update OrchestratorAgent Skills.md pipeline order if needed