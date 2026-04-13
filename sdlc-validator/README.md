# AI-SDLC Playbook Validator — VS Code Extension v2.0

Full validation + AI-powered assistant for the AI-SDLC agent playbook.

---

## What It Does

### Phase 1 — Validation (No AI, No Cost)
- Validate folder naming rules (PascalCase, Agent suffix)
- Validate file presence (Skills.md + Validation.md must both exist)
- Validate all required sections inside .md files
- Detect duplicate agent names across the repo
- Validate sub-agent hierarchy rules
- Validate model configuration fields
- Detect YAML-style formatting violations
- Auto-validates on every file save

### Phase 2 — AI Assistant (OpenRouter free models)
- Knows your full project context automatically
- Suggests content for missing sections
- Recommends how many sub-agents an agent needs
- Helps write System Message, MUST PASS checks, failure scenarios
- Uses free OpenRouter models — no cost

---

## Install

```bash
# 1. Install dependencies
npm install

# 2. Compile
npm run compile

# 3. Package
npm install -g @vscode/vsce
vsce package

# 4. Install in VS Code
# Ctrl+Shift+P → "Extensions: Install from VSIX" → select .vsix file
```

---

## Commands

| Command | How to trigger |
|---|---|
| Validate This File | Right-click Skills.md or Validation.md → AI-SDLC: Validate This File |
| Validate Agent Folder | Right-click any agent folder → AI-SDLC: Validate This Agent Folder |
| Validate All Agents | Ctrl+Shift+P → AI-SDLC: Validate All Agent Files |
| AI Assistant | Right-click Skills.md or Validation.md → AI-SDLC: AI Assistant |
| Set API Key | Ctrl+Shift+P → AI-SDLC: Set OpenRouter API Key |

---

## AI Assistant Setup (Free)

1. Go to https://openrouter.ai and create a free account
2. Get your API key (free tier available)
3. In VS Code: Ctrl+Shift+P → "AI-SDLC: Set OpenRouter API Key"
4. Right-click any Skills.md or Validation.md → "AI-SDLC: AI Assistant"

Free models used (in priority order):
- meta-llama/llama-3.1-8b-instruct:free
- mistralai/mistral-7b-instruct:free
- google/gemma-2-9b-it:free

---

## Validation Rules (from README)

### Folder Rules
- Name must be PascalCase ending with "Agent"
- Must be inside CoreAgent/, CommonAgent/, or MasterAgent/
- Must contain exactly Skills.md + Validation.md (no extra files)
- Sub-agents go inside subagents/ folder

### Skills.md Required Sections
Agent Name | System Message | Skill Description | Model Configuration
Inputs | Outputs | Failure / Fallback Behavior
(Sub-agents also need: Parent Agent)

### Validation.md Required Sections
Agent Name | Validation Version | Purpose | MUST PASS
QUALITY CHECKS | Self-Healing Rules | Human Approval Gate

### Model Configuration Required Fields
Primary Model | Fallback Model | Temperature

### Other Rules
- PascalCase naming everywhere
- No YAML-style formatting (use "- **Key**: value")
- Completion signal required in Skills.md
- Sub-agents must reference Parent Agent
- Parent agents must list Sub-Agents if subagents/ folder exists
- Duplicate agent names across repo are flagged as errors

---

## Team
AI-SDLC Playbook Team
