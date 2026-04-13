"use strict";
// ── formatter.ts — Output panel formatting ───────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatWorkspaceResults = formatWorkspaceResults;
exports.formatSingleFileResult = formatSingleFileResult;
function formatWorkspaceResults(result) {
    const lines = [];
    lines.push('');
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║         AI-SDLC PLAYBOOK VALIDATOR  v2.0                     ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');
    // Summary
    const statusIcon = result.passed ? '✅' : '❌';
    lines.push(`  ${statusIcon}  OVERALL STATUS: ${result.passed ? 'PASSED' : 'FAILED'}`);
    lines.push('');
    lines.push(`  📁  Agents checked:   ${result.totalAgents}`);
    lines.push(`  📄  Files checked:    ${result.totalFiles}`);
    lines.push(`  ❌  Errors:           ${result.totalErrors}`);
    lines.push(`  ⚠️   Warnings:         ${result.totalWarnings}`);
    if (result.duplicateAgentNames.length > 0) {
        lines.push('');
        lines.push(`  🔴  DUPLICATE AGENT NAMES DETECTED:`);
        for (const dup of result.duplicateAgentNames) {
            lines.push(`       → "${dup}" appears more than once in the repository`);
        }
    }
    lines.push('');
    lines.push('──────────────────────────────────────────────────────────────');
    // Per-folder results
    for (const folderResult of result.folderResults) {
        lines.push(...formatFolderResult(folderResult));
    }
    // Footer legend
    lines.push('');
    lines.push('══════════════════════════════════════════════════════════════');
    lines.push('  LEGEND:');
    lines.push('  ❌ ERROR   — Must fix before pipeline can use this agent');
    lines.push('  ⚠️  WARNING — Should fix, does not block pipeline');
    lines.push('  ℹ️  INFO    — Informational note');
    lines.push('');
    lines.push('  REQUIRED SECTIONS IN Skills.md:');
    lines.push('  Agent Name | System Message | Skill Description |');
    lines.push('  Model Configuration | Inputs | Outputs | Failure / Fallback Behavior');
    lines.push('');
    lines.push('  REQUIRED SECTIONS IN Validation.md:');
    lines.push('  Agent Name | Validation Version | Purpose | MUST PASS |');
    lines.push('  QUALITY CHECKS | Self-Healing Rules | Human Approval Gate');
    lines.push('══════════════════════════════════════════════════════════════');
    lines.push('');
    return lines.join('\n');
}
function formatFolderResult(result) {
    const lines = [];
    const statusIcon = result.passed ? '✅' : '❌';
    lines.push('');
    lines.push(`  ${statusIcon}  AGENT: ${result.folderName}  [${result.agentCategory}]`);
    // Folder-level issues
    if (result.issues.length > 0) {
        for (const issue of result.issues) {
            lines.push(...formatIssue(issue, '      '));
        }
    }
    // File-level results
    for (const fileResult of result.files) {
        lines.push(...formatFileResult(fileResult));
    }
    return lines;
}
function formatFileResult(result) {
    const lines = [];
    if (result.issues.length === 0) {
        lines.push(`       ✅  ${result.fileName} — all checks passed`);
        return lines;
    }
    const errors = result.issues.filter(i => i.type === 'error');
    const warnings = result.issues.filter(i => i.type === 'warning');
    lines.push(`       📄  ${result.fileName}:`);
    for (const issue of [...errors, ...warnings]) {
        lines.push(...formatIssue(issue, '           '));
    }
    return lines;
}
function formatIssue(issue, indent) {
    const lines = [];
    const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️ ' : 'ℹ️ ';
    lines.push(`${indent}${icon} [${issue.category}] ${issue.message}`);
    lines.push(`${indent}   → Fix: ${issue.fix}`);
    return lines;
}
function formatSingleFileResult(result) {
    const lines = [];
    const statusIcon = result.passed ? '✅' : '❌';
    lines.push('');
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║       AI-SDLC PLAYBOOK VALIDATOR — Single File               ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push(`  ${statusIcon}  File:   ${result.fileName}`);
    lines.push(`      Agent:  ${result.agentName}`);
    lines.push(`      Type:   ${result.fileType}`);
    lines.push('');
    if (result.issues.length === 0) {
        lines.push('  ✅  All checks passed! This file follows all playbook standards.');
    }
    else {
        const errors = result.issues.filter(i => i.type === 'error');
        const warnings = result.issues.filter(i => i.type === 'warning');
        lines.push(`  📊  ${errors.length} error(s)  |  ${warnings.length} warning(s)`);
        lines.push('──────────────────────────────────────────────────────────────');
        if (errors.length > 0) {
            lines.push('');
            lines.push('  ❌  ERRORS — Must fix:');
            for (const issue of errors) {
                lines.push(`     • [${issue.category}] ${issue.message}`);
                lines.push(`       → Fix: ${issue.fix}`);
            }
        }
        if (warnings.length > 0) {
            lines.push('');
            lines.push('  ⚠️   WARNINGS — Should fix:');
            for (const issue of warnings) {
                lines.push(`     • [${issue.category}] ${issue.message}`);
                lines.push(`       → Fix: ${issue.fix}`);
            }
        }
    }
    lines.push('');
    lines.push('══════════════════════════════════════════════════════════════');
    lines.push('  Tip: Right-click any Skills.md or Validation.md →');
    lines.push('       "AI-SDLC: AI Assistant" for AI-powered content help');
    lines.push('══════════════════════════════════════════════════════════════');
    return lines.join('\n');
}
