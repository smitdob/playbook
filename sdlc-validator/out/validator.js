"use strict";
// ── validator.ts — Complete validation engine ────────────────────────────────
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAgentName = extractAgentName;
exports.validateAgentFolder = validateAgentFolder;
exports.validateSingleFile = validateSingleFile;
exports.validateWorkspace = validateWorkspace;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rules_1 = require("./rules");
// ── Helpers ──────────────────────────────────────────────────────────────────
function extractAgentName(content) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('## Agent Name')) {
            // Look at next non-empty line
            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                const val = lines[j].trim();
                if (val.length > 0 && !val.startsWith('#'))
                    return val;
            }
        }
    }
    return '';
}
function getSectionContent(content, sectionHeader) {
    const escaped = sectionHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped + '\\s*\\n([\\s\\S]*?)(?=\\n##|$)', 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
}
function isInsideCodeBlock(content, position) {
    const before = content.substring(0, position);
    const codeBlocks = (before.match(/```/g) || []).length;
    return codeBlocks % 2 !== 0;
}
function isSubAgent(folderPath) {
    return folderPath.includes('subagents');
}
// ── Skills.md validator ──────────────────────────────────────────────────────
function validateSkillsFile(content, filePath) {
    const issues = [];
    const isSub = isSubAgent(filePath);
    // ── 1. Required sections ─────────────────────────────────────────────────
    const sectionsToCheck = isSub
        ? [...rules_1.SKILLS_REQUIRED_SECTIONS, ...rules_1.SKILLS_SUBAGENT_REQUIRED_SECTIONS]
        : rules_1.SKILLS_REQUIRED_SECTIONS;
    for (const section of sectionsToCheck) {
        if (!content.includes(section)) {
            issues.push({
                type: 'error',
                category: 'Missing Section',
                message: `Missing required section: "${section}"`,
                fix: `Add "${section}:" heading to Skills.md`,
            });
        }
        else {
            const sectionContent = getSectionContent(content, section);
            if (sectionContent.length === 0) {
                issues.push({
                    type: 'error',
                    category: 'Empty Section',
                    message: `Section "${section}" is present but empty`,
                    fix: `Fill in the content for "${section}"`,
                });
            }
        }
    }
    // ── 2. Agent Name: must be PascalCase ending with Agent ─────────────────
    const agentName = extractAgentName(content);
    if (!agentName) {
        issues.push({
            type: 'error',
            category: 'Naming Rule',
            message: 'Agent Name is missing or not found after "## Agent Name"',
            fix: 'Add the agent name on the line directly after "## Agent Name:"',
        });
    }
    else if (!rules_1.PASCAL_CASE_AGENT_REGEX.test(agentName)) {
        issues.push({
            type: 'error',
            category: 'Naming Rule',
            message: `Agent name "${agentName}" does not follow PascalCase naming convention`,
            fix: `Rename to PascalCase format ending with "Agent" — e.g. "${agentName.replace(/[-_]/g, '')}Agent"`,
        });
    }
    // ── 3. Model Configuration fields ───────────────────────────────────────
    if (content.includes('## Model Configuration')) {
        const modelSection = getSectionContent(content, '## Model Configuration');
        for (const field of rules_1.MODEL_CONFIG_REQUIRED_FIELDS) {
            if (!modelSection.includes(field)) {
                issues.push({
                    type: 'error',
                    category: 'Model Configuration',
                    message: `Missing model field: "${field}" in ## Model Configuration`,
                    fix: `Add "- ${field}: [value]" inside ## Model Configuration`,
                });
            }
        }
        // Check for YAML-style model config (README Rule 1)
        const yamlStyleRegex = /^[A-Za-z]+Model:\s*\S/m;
        if (yamlStyleRegex.test(modelSection)) {
            issues.push({
                type: 'error',
                category: 'Formatting Rule',
                message: 'Model Configuration uses YAML-style format (e.g. "PrimaryModel: value")',
                fix: 'Use bullet format: "- **Primary Model**: value" — YAML style is not allowed per GlobalRules',
            });
        }
    }
    // ── 4. Failure section content ───────────────────────────────────────────
    if (content.includes('## Failure / Fallback Behavior')) {
        const failureContent = getSectionContent(content, '## Failure / Fallback Behavior');
        if (failureContent.length < 30) {
            issues.push({
                type: 'error',
                category: 'Empty Section',
                message: '"## Failure / Fallback Behavior" has insufficient content',
                fix: 'Add at least 2-3 failure scenarios using "→" arrow format. Add a "- Never:" block.',
            });
        }
        else {
            if (!failureContent.includes('Never:') && !failureContent.includes('- Never')) {
                issues.push({
                    type: 'warning',
                    category: 'Failure Handling Rule',
                    message: 'No "Never:" block in Failure section (README Rule 4)',
                    fix: 'Add "- Never:\\n  → [what agent must never do]" block',
                });
            }
            if (!failureContent.includes('SelfHealingAgent') && !failureContent.includes('HumanApprovalAgent')) {
                issues.push({
                    type: 'warning',
                    category: 'Failure Handling Rule',
                    message: 'Failure section does not reference SelfHealingAgent or HumanApprovalAgent',
                    fix: 'Per README Rule 4: route failures to SelfHealingAgent or HumanApprovalAgent',
                });
            }
        }
    }
    // ── 5. Sub-Agent rules (README Rule 5) ──────────────────────────────────
    const subagentsFolderExists = fs.existsSync(path.join(path.dirname(filePath), 'subagents'));
    if (subagentsFolderExists) {
        if (!content.includes('## Sub-Agents')) {
            issues.push({
                type: 'error',
                category: 'Sub-Agent Rule',
                message: 'subagents/ folder exists but "## Sub-Agents" section is missing (README Rule 5)',
                fix: 'Add "## Sub-Agents" section and list each sub-agent name',
            });
        }
        else {
            const subContent = getSectionContent(content, '## Sub-Agents');
            if (subContent.length === 0) {
                issues.push({
                    type: 'warning',
                    category: 'Sub-Agent Rule',
                    message: '"## Sub-Agents" section is empty but subagents/ folder exists',
                    fix: 'List all sub-agent names inside the ## Sub-Agents section',
                });
            }
            else {
                // Cross-check: agents listed in ## Sub-Agents should have folders
                const subFolderPath = path.join(path.dirname(filePath), 'subagents');
                if (fs.existsSync(subFolderPath)) {
                    const actualSubFolders = fs.readdirSync(subFolderPath)
                        .filter(f => fs.statSync(path.join(subFolderPath, f)).isDirectory());
                    for (const subfolder of actualSubFolders) {
                        if (!subContent.includes(subfolder)) {
                            issues.push({
                                type: 'warning',
                                category: 'Sub-Agent Rule',
                                message: `Sub-agent folder "${subfolder}" exists but is not listed in ## Sub-Agents`,
                                fix: `Add "${subfolder}" to the ## Sub-Agents section`,
                            });
                        }
                    }
                }
            }
        }
    }
    // Sub-agent must reference parent (README Rule 5)
    if (isSub && content.includes('## Parent Agent')) {
        const parentContent = getSectionContent(content, '## Parent Agent');
        if (parentContent.length === 0) {
            issues.push({
                type: 'error',
                category: 'Sub-Agent Rule',
                message: '"## Parent Agent" section is empty (README Rule 5)',
                fix: 'Add the parent agent name (e.g. "DeveloperAgent") under ## Parent Agent',
            });
        }
    }
    // ── 6. Completion signal ─────────────────────────────────────────────────
    const hasSignal = rules_1.VALID_COMPLETION_SIGNALS.some(s => content.includes(s));
    if (!hasSignal) {
        issues.push({
            type: 'warning',
            category: 'Completion Signal',
            message: 'No completion signal found in Skills.md',
            fix: `Add a completion signal in System Message rules (e.g. REQUIREMENT_DONE, QA_DONE). Valid: ${rules_1.VALID_COMPLETION_SIGNALS.slice(0, 5).join(', ')}...`,
        });
    }
    // ── 7. YAML-style formatting check (README Rule 1) ──────────────────────
    const contentLines = content.split('\n');
    let inCodeBlock = false;
    for (let lineNo = 0; lineNo < contentLines.length; lineNo++) {
        const line = contentLines[lineNo];
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock)
            continue;
        // Detect YAML style: "key: value" at start of line (not markdown headings/bullets)
        if (/^[A-Za-z][A-Za-z0-9]+:\s+\S/.test(line) && !line.startsWith('-') && !line.startsWith('#')) {
            issues.push({
                type: 'warning',
                category: 'Formatting Rule',
                message: `Line ${lineNo + 1}: Possible YAML-style formatting detected: "${line.trim()}"`,
                fix: 'Use bullet format: "- **Key**: value" instead of "Key: value" (README Rule 1)',
            });
            break; // Report once per file to avoid spam
        }
    }
    return issues;
}
// ── Validation.md validator ──────────────────────────────────────────────────
function validateValidationFile(content) {
    const issues = [];
    // ── 1. Required sections ─────────────────────────────────────────────────
    for (const section of rules_1.VALIDATION_REQUIRED_SECTIONS) {
        if (!content.includes(section)) {
            issues.push({
                type: 'error',
                category: 'Missing Section',
                message: `Missing required section: "${section}"`,
                fix: `Add "${section}" heading to Validation.md`,
            });
        }
        else {
            const sectionContent = getSectionContent(content, section);
            if (sectionContent.length === 0) {
                issues.push({
                    type: 'error',
                    category: 'Empty Section',
                    message: `Section "${section}" is empty`,
                    fix: `Fill in the content for "${section}"`,
                });
            }
        }
    }
    // ── 2. Validation Version ────────────────────────────────────────────────
    if (content.includes('## Validation Version')) {
        const versionContent = getSectionContent(content, '## Validation Version');
        if (!versionContent.match(/\d+\.\d+\.\d+/)) {
            issues.push({
                type: 'error',
                category: 'Version Format',
                message: '"## Validation Version" does not contain a valid semver number',
                fix: 'Add version in format "1.0.0" below ## Validation Version',
            });
        }
    }
    // ── 3. MUST PASS checkboxes ──────────────────────────────────────────────
    if (content.includes('## MUST PASS')) {
        const mustContent = getSectionContent(content, '## MUST PASS');
        const checkboxes = (mustContent.match(/- \[[ xX]\]/g) || []).length;
        if (checkboxes === 0) {
            issues.push({
                type: 'error',
                category: 'MUST PASS',
                message: '"## MUST PASS" has no checklist items',
                fix: 'Add items using "- [ ] Your check here" checkbox format',
            });
        }
        else if (checkboxes < 3) {
            issues.push({
                type: 'warning',
                category: 'MUST PASS',
                message: `"## MUST PASS" only has ${checkboxes} item(s) — minimum recommended is 3`,
                fix: 'Add more validation checks to ensure thorough output quality control',
            });
        }
    }
    // ── 4. QUALITY CHECKS content ────────────────────────────────────────────
    if (content.includes('## QUALITY CHECKS')) {
        const qcContent = getSectionContent(content, '## QUALITY CHECKS');
        const checkboxes = (qcContent.match(/- \[[ xX]\]/g) || []).length;
        if (checkboxes === 0) {
            issues.push({
                type: 'warning',
                category: 'Quality Checks',
                message: '"## QUALITY CHECKS" has no checklist items',
                fix: 'Add quality check items using "- [ ] Check here" format',
            });
        }
    }
    // ── 5. Self-Healing Rules mentions retry ─────────────────────────────────
    if (content.includes('## Self-Healing Rules')) {
        const shContent = getSectionContent(content, '## Self-Healing Rules');
        if (!shContent.toLowerCase().includes('retry') && !shContent.includes('SelfHealingAgent')) {
            issues.push({
                type: 'warning',
                category: 'Self-Healing',
                message: '"## Self-Healing Rules" does not mention retry logic or SelfHealingAgent',
                fix: 'Specify retry count and SelfHealingAgent trigger condition',
            });
        }
        if (!shContent.match(/\d+\s*retries?/i) && !shContent.match(/maximum\s+\d+/i)) {
            issues.push({
                type: 'warning',
                category: 'Self-Healing',
                message: 'No maximum retry count defined in Self-Healing Rules',
                fix: 'Add "Maximum 2 retries before escalating to human"',
            });
        }
    }
    // ── 6. Human Approval Gate has checkpoint label ──────────────────────────
    if (content.includes('## Human Approval Gate')) {
        const haContent = getSectionContent(content, '## Human Approval Gate');
        if (!haContent.includes('APPROVAL') && !haContent.includes('Checkpoint')) {
            issues.push({
                type: 'warning',
                category: 'Human Approval',
                message: '"## Human Approval Gate" does not define a checkpoint label',
                fix: 'Add "- Checkpoint Label: [AGENT_APPROVAL]" e.g. BA_APPROVAL, QA_APPROVAL',
            });
        }
    }
    return issues;
}
// ── Folder validator (naming + file presence) ────────────────────────────────
function validateAgentFolder(folderPath) {
    const folderName = path.basename(folderPath);
    const parentFolder = path.basename(path.dirname(folderPath));
    const issues = [];
    const fileResults = [];
    // ── Folder naming: PascalCase ending with Agent ───────────────────────────
    if (!rules_1.PASCAL_CASE_AGENT_REGEX.test(folderName)) {
        issues.push({
            type: 'error',
            category: 'Naming Rule',
            message: `Folder name "${folderName}" does not follow PascalCase naming (README Rule 2)`,
            fix: `Rename to PascalCase ending with "Agent" — e.g. "${folderName}Agent" or "My${folderName}Agent"`,
        });
    }
    // ── Parent category check ────────────────────────────────────────────────
    if (!rules_1.VALID_AGENT_CATEGORIES.includes(parentFolder) && parentFolder !== 'subagents') {
        issues.push({
            type: 'warning',
            category: 'Structure Rule',
            message: `Agent folder "${folderName}" is not inside a valid category (CoreAgent/CommonAgent/MasterAgent/subagents)`,
            fix: `Move to agents/CoreAgent/, agents/CommonAgent/, or agents/MasterAgent/`,
        });
    }
    // ── Check for required files: Skills.md and Validation.md ────────────────
    const skillsPath = path.join(folderPath, 'Skills.md');
    const validationPath = path.join(folderPath, 'Validation.md');
    if (!fs.existsSync(skillsPath)) {
        issues.push({
            type: 'error',
            category: 'Missing File',
            message: `"Skills.md" is missing from ${folderName}/`,
            fix: 'Create Skills.md with all required sections (see README Mandatory Agent Standards)',
        });
    }
    if (!fs.existsSync(validationPath)) {
        issues.push({
            type: 'error',
            category: 'Missing File',
            message: `"Validation.md" is missing from ${folderName}/`,
            fix: 'Create Validation.md with all required sections (see README Mandatory Agent Standards)',
        });
    }
    // ── Check for unexpected extra files ─────────────────────────────────────
    const allEntries = fs.readdirSync(folderPath);
    const allowedFiles = ['Skills.md', 'Validation.md'];
    const allowedFolders = ['subagents'];
    for (const entry of allEntries) {
        const entryPath = path.join(folderPath, entry);
        const isDir = fs.statSync(entryPath).isDirectory();
        if (isDir) {
            if (!allowedFolders.includes(entry)) {
                issues.push({
                    type: 'warning',
                    category: 'Structure Rule',
                    message: `Unexpected folder "${entry}" inside ${folderName}/ — only "subagents/" is allowed`,
                    fix: 'Remove unexpected folder or move its contents to the correct location',
                });
            }
        }
        else {
            if (!allowedFiles.includes(entry)) {
                issues.push({
                    type: 'warning',
                    category: 'Structure Rule',
                    message: `Unexpected file "${entry}" inside ${folderName}/ — only Skills.md and Validation.md allowed`,
                    fix: 'Remove or move the file. Each agent folder must have exactly 2 files.',
                });
            }
        }
    }
    // ── Validate each .md file ───────────────────────────────────────────────
    if (fs.existsSync(skillsPath)) {
        fileResults.push(validateSingleFile(skillsPath));
    }
    if (fs.existsSync(validationPath)) {
        fileResults.push(validateSingleFile(validationPath));
    }
    // ── Validate subagents if present ────────────────────────────────────────
    const subagentsFolderPath = path.join(folderPath, 'subagents');
    if (fs.existsSync(subagentsFolderPath)) {
        const subFolders = fs.readdirSync(subagentsFolderPath)
            .filter(f => fs.statSync(path.join(subagentsFolderPath, f)).isDirectory());
        for (const sub of subFolders) {
            // SubAgent folder naming check
            if (!rules_1.PASCAL_CASE_AGENT_REGEX.test(sub)) {
                issues.push({
                    type: 'error',
                    category: 'Sub-Agent Naming',
                    message: `Sub-agent folder "${sub}" does not follow PascalCase naming (README Rule 5)`,
                    fix: `Rename to PascalCase format e.g. "${sub}Agent"`,
                });
            }
            const subPath = path.join(subagentsFolderPath, sub);
            const subResult = validateAgentFolder(subPath);
            fileResults.push(...subResult.files);
            issues.push(...subResult.issues.map(i => ({
                ...i,
                message: `[SubAgent: ${sub}] ${i.message}`,
            })));
        }
    }
    const allIssues = [...issues, ...fileResults.flatMap(f => f.issues)];
    const hasErrors = allIssues.some(i => i.type === 'error');
    return {
        folderPath,
        folderName,
        agentCategory: parentFolder,
        issues,
        files: fileResults,
        passed: !hasErrors,
    };
}
// ── Single file validator ────────────────────────────────────────────────────
function validateSingleFile(filePath) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const agentName = extractAgentName(content);
    let fileType = 'unknown';
    let issues = [];
    if (fileName === 'Skills.md') {
        fileType = 'Skills.md';
        issues = validateSkillsFile(content, filePath);
    }
    else if (fileName === 'Validation.md') {
        fileType = 'Validation.md';
        issues = validateValidationFile(content);
    }
    return {
        filePath,
        fileName,
        fileType,
        agentName: agentName || path.basename(path.dirname(filePath)),
        issues,
        passed: !issues.some(i => i.type === 'error'),
    };
}
// ── Workspace-wide validator ─────────────────────────────────────────────────
async function validateWorkspace(agentsRootPath, selectedPaths) {
    const folderResults = [];
    const allAgentNames = [];
    const duplicateAgentNames = [];
    function findAgentFolders(dirPath) {
        const results = [];
        if (!fs.existsSync(dirPath))
            return results;
        const entries = fs.readdirSync(dirPath);
        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry);
            if (!fs.statSync(entryPath).isDirectory())
                continue;
            const hasSkills = fs.existsSync(path.join(entryPath, 'Skills.md'));
            const hasValidation = fs.existsSync(path.join(entryPath, 'Validation.md'));
            if (hasSkills || hasValidation) {
                results.push(entryPath);
            }
            else {
                // Recurse into category folders (CoreAgent, CommonAgent, etc.)
                results.push(...findAgentFolders(entryPath));
            }
        }
        return results;
    }
    const agentFolders = selectedPaths || findAgentFolders(agentsRootPath);
    for (const folderPath of agentFolders) {
        if (!fs.statSync(folderPath).isDirectory())
            continue;
        const result = validateAgentFolder(folderPath);
        folderResults.push(result);
        // Collect agent names for duplicate detection
        for (const fileResult of result.files) {
            if (fileResult.fileName === 'Skills.md' && fileResult.agentName) {
                if (allAgentNames.includes(fileResult.agentName)) {
                    if (!duplicateAgentNames.includes(fileResult.agentName)) {
                        duplicateAgentNames.push(fileResult.agentName);
                    }
                }
                else {
                    allAgentNames.push(fileResult.agentName);
                }
            }
        }
    }
    // Flag duplicate agent names
    if (duplicateAgentNames.length > 0) {
        for (const result of folderResults) {
            for (const fileResult of result.files) {
                if (duplicateAgentNames.includes(fileResult.agentName)) {
                    result.issues.push({
                        type: 'error',
                        category: 'Duplicate Agent Name',
                        message: `Duplicate agent name "${fileResult.agentName}" found in multiple locations`,
                        fix: 'Each agent must have a unique name across the entire repository',
                    });
                }
            }
        }
    }
    const totalErrors = folderResults.reduce((sum, r) => sum + [...r.issues, ...r.files.flatMap(f => f.issues)].filter(i => i.type === 'error').length, 0);
    const totalWarnings = folderResults.reduce((sum, r) => sum + [...r.issues, ...r.files.flatMap(f => f.issues)].filter(i => i.type === 'warning').length, 0);
    return {
        totalFiles: folderResults.reduce((sum, r) => sum + r.files.length, 0),
        totalAgents: folderResults.length,
        totalErrors,
        totalWarnings,
        duplicateAgentNames,
        folderResults,
        passed: totalErrors === 0,
    };
}
