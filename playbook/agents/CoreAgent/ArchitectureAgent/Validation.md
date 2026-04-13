## Agent Name
ArchitectureAgent

## Validation Version
- 1.0.0

## Purpose:`
Ensure ArchitectureAgent output is complete and implementation-ready
before passing to DeveloperAgent.

---

## MUST PASS

- [ ] Recommended Tech Stack section present with justification
- [ ] System Architecture section present
- [ ] Database Schema section present — minimum 1 table
- [ ] API Endpoints section present — minimum 2 endpoints
- [ ] Technical Risks section present
- [ ] Output ends with: ARCHITECTURE_DONE

---

## QUALITY CHECKS

- [ ] Every technology choice has a reason stated
- [ ] No technology mentioned without explicit justification
- [ ] Architecture aligns with requirements from RequirementAgent
- [ ] No scope added beyond what RequirementAgent defined

---

## Self-Healing Rules

- If MUST PASS fails:
  → SelfHealingAgent retries with note: "Missing [section]. Please regenerate."
  → Maximum 2 retries before escalating to human

- If QUALITY CHECK fails:
  → Log warning, continue pipeline with OUTPUT_WARNING flag

---

## Human Approval Gate

- Checkpoint Label: ARCH_APPROVAL
- Pipeline pauses until human approves or rejects