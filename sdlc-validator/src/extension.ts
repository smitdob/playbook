// ── extension.ts — Main VS Code extension entry point ───────────────────────

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { validateSingleFile, validateAgentFolder, validateWorkspace } from './validator';
import { formatSingleFileResult, formatWorkspaceResults } from './formatter';
import { showAiAssistPanel } from './aiAssistant';

// ── Shared output channel ────────────────────────────────────────────────────
let outputChannel: vscode.OutputChannel;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('AI-SDLC Validator');
  }
  return outputChannel;
}

// ── Find agents root folder in workspace ────────────────────────────────────
function findAgentsRoot(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return undefined;

  for (const folder of workspaceFolders) {
    // Look for agents/ or playbook/agents/
    const candidates = [
      path.join(folder.uri.fsPath, 'agents'),
      path.join(folder.uri.fsPath, 'playbook', 'agents'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return workspaceFolders[0]?.uri.fsPath;
}

// ── Command: Validate single file ───────────────────────────────────────────
async function commandValidateFile(uri?: vscode.Uri): Promise<void> {
  let filePath: string | undefined;

  if (uri) {
    filePath = uri.fsPath;
  } else {
    const editor = vscode.window.activeTextEditor;
    filePath = editor?.document.uri.fsPath;
  }

  if (!filePath) {
    vscode.window.showErrorMessage('AI-SDLC: No file selected. Open a Skills.md or Validation.md file.');
    return;
  }

  const fileName = path.basename(filePath);
  if (fileName !== 'Skills.md' && fileName !== 'Validation.md') {
    vscode.window.showWarningMessage(
      `AI-SDLC: "${fileName}" is not a Skills.md or Validation.md file.`
    );
    return;
  }

  const result = validateSingleFile(filePath);
  const output = formatSingleFileResult(result);

  const channel = getOutputChannel();
  channel.clear();
  channel.appendLine(output);
  channel.show();

  // Show notification
  const errors = result.issues.filter(i => i.type === 'error').length;
  const warnings = result.issues.filter(i => i.type === 'warning').length;

  if (errors === 0 && warnings === 0) {
    vscode.window.showInformationMessage(`✅ ${fileName} — All checks passed!`);
  } else if (errors === 0) {
    const msg = `⚠️ ${fileName} — ${warnings} warning(s). See Output panel.`;
    const action = await vscode.window.showWarningMessage(msg, 'Open AI Assistant');
    if (action === 'Open AI Assistant') {
      await showAiAssistPanel({} as any, filePath);
    }
  } else {
    const msg = `❌ ${fileName} — ${errors} error(s), ${warnings} warning(s). See Output panel.`;
    const action = await vscode.window.showErrorMessage(msg, 'Open AI Assistant', 'Show Output');
    if (action === 'Open AI Assistant') {
      await showAiAssistPanel({} as any, filePath);
    }
  }
}

// ── Command: Validate agent folder ──────────────────────────────────────────
async function commandValidateFolder(uri?: vscode.Uri): Promise<void> {
  let folderPath: string | undefined;

  if (uri) {
    folderPath = uri.fsPath;
  } else {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    folderPath = workspaceFolders?.[0]?.uri.fsPath;
  }

  if (!folderPath || !fs.statSync(folderPath).isDirectory()) {
    vscode.window.showErrorMessage('AI-SDLC: Please right-click on an agent folder to validate it.');
    return;
  }

  const result = validateAgentFolder(folderPath);

  // Build output
  const lines: string[] = [];
  lines.push('');
  lines.push('╔══════════════════════════════════════════════════════════════╗');
  lines.push(`║  AI-SDLC Folder Validation: ${result.folderName.padEnd(33)}║`);
  lines.push('╚══════════════════════════════════════════════════════════════╝');
  lines.push('');

  const allIssues = [...result.issues, ...result.files.flatMap(f => f.issues)];
  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');

  lines.push(`  ${result.passed ? '✅' : '❌'}  Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
  lines.push(`      Errors:   ${errors.length}`);
  lines.push(`      Warnings: ${warnings.length}`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('  📁 Folder-level issues:');
    for (const issue of result.issues) {
      const icon = issue.type === 'error' ? '❌' : '⚠️ ';
      lines.push(`     ${icon} [${issue.category}] ${issue.message}`);
      lines.push(`        → Fix: ${issue.fix}`);
    }
    lines.push('');
  }

  for (const fileResult of result.files) {
    if (fileResult.issues.length === 0) {
      lines.push(`  ✅ ${fileResult.fileName} — passed`);
    } else {
      lines.push(`  📄 ${fileResult.fileName}:`);
      for (const issue of fileResult.issues) {
        const icon = issue.type === 'error' ? '  ❌' : '  ⚠️ ';
        lines.push(`  ${icon} [${issue.category}] ${issue.message}`);
        lines.push(`       → Fix: ${issue.fix}`);
      }
    }
  }

  const channel = getOutputChannel();
  channel.clear();
  channel.appendLine(lines.join('\n'));
  channel.show();

  if (errors.length === 0 && warnings.length === 0) {
    vscode.window.showInformationMessage(`✅ ${result.folderName} — All checks passed!`);
  } else if (errors.length === 0) {
    vscode.window.showWarningMessage(`⚠️ ${result.folderName} — ${warnings.length} warning(s). See Output.`);
  } else {
    vscode.window.showErrorMessage(`❌ ${result.folderName} — ${errors.length} error(s). See Output.`);
  }
}

// ── Command: Validate all files ──────────────────────────────────────────────
async function commandValidateAll(): Promise<void> {
  const agentsRoot = findAgentsRoot();
  if (!agentsRoot) {
    vscode.window.showErrorMessage('AI-SDLC: No workspace folder found.');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'AI-SDLC: Scanning all agent files...',
      cancellable: false,
    },
    async (progress) => {

      progress.report({ message: 'Finding agent folders...' });

      // Find all agent folders for quick-pick
      function findAgentFolders(dirPath: string): string[] {
        const results: string[] = [];
        if (!fs.existsSync(dirPath)) return results;
        for (const entry of fs.readdirSync(dirPath)) {
          const entryPath = path.join(dirPath, entry);
          if (!fs.statSync(entryPath).isDirectory()) continue;
          const hasFiles = fs.existsSync(path.join(entryPath, 'Skills.md'))
            || fs.existsSync(path.join(entryPath, 'Validation.md'));
          if (hasFiles) {
            results.push(entryPath);
          } else {
            results.push(...findAgentFolders(entryPath));
          }
        }
        return results;
      }

      const agentFolders = findAgentFolders(agentsRoot);

      if (agentFolders.length === 0) {
        vscode.window.showWarningMessage(
          'AI-SDLC: No agent folders found. Make sure your workspace contains agents/ folder.'
        );
        return;
      }

      // Show quickpick for selection
      const items = agentFolders.map(fp => {
        const relative = fp.replace(agentsRoot, '').replace(/\\/g, '/');
        return {
          label: path.basename(fp),
          description: relative,
          detail: fp,
          picked: true,
        };
      });

      const selected = await vscode.window.showQuickPick(items, {
        canPickMany: true,
        placeHolder: `Select agent folders to validate (${items.length} found)`,
        title: 'AI-SDLC Validator — Select Agents',
      });

      if (!selected || selected.length === 0) return;

      progress.report({ message: `Validating ${selected.length} agent(s)...` });

      const selectedPaths = selected.map(s => s.detail!);
      const result = await validateWorkspace(agentsRoot, selectedPaths);
      const output = formatWorkspaceResults(result);

      const channel = getOutputChannel();
      channel.clear();
      channel.appendLine(output);
      channel.show();

      // Final notification
      if (result.totalErrors === 0 && result.totalWarnings === 0) {
        vscode.window.showInformationMessage(
          `✅ All ${result.totalAgents} agents passed validation!`
        );
      } else if (result.totalErrors === 0) {
        vscode.window.showWarningMessage(
          `⚠️ ${result.totalAgents} agents — ${result.totalWarnings} warning(s). See Output panel.`
        );
      } else {
        vscode.window.showErrorMessage(
          `❌ ${result.totalAgents} agents — ${result.totalErrors} error(s), ${result.totalWarnings} warning(s). See Output panel.`
        );
      }
    }
  );
}

// ── Command: Set API Key ─────────────────────────────────────────────────────
async function commandSetApiKey(): Promise<void> {
  const apiKey = await vscode.window.showInputBox({
    prompt: 'Enter your OpenRouter API key (free at openrouter.ai)',
    placeHolder: 'sk-or-v1-...',
    password: true,
    ignoreFocusOut: true,
  });

  if (apiKey) {
    await vscode.workspace.getConfiguration('sdlcValidator').update(
      'openrouterApiKey', apiKey, true
    );
    vscode.window.showInformationMessage(
      '✅ API key saved! You can now use AI Assistant on any Skills.md or Validation.md file.'
    );
  }
}

// ── Activate extension ───────────────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext): void {

  // Register all commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'sdlcValidator.validateFile',
      (uri?: vscode.Uri) => commandValidateFile(uri)
    ),
    vscode.commands.registerCommand(
      'sdlcValidator.validateFolder',
      (uri?: vscode.Uri) => commandValidateFolder(uri)
    ),
    vscode.commands.registerCommand(
      'sdlcValidator.validateAll',
      () => commandValidateAll()
    ),
    vscode.commands.registerCommand(
      'sdlcValidator.aiAssist',
      (uri?: vscode.Uri) => showAiAssistPanel(context, uri?.fsPath)
    ),
    vscode.commands.registerCommand(
      'sdlcValidator.setApiKey',
      () => commandSetApiKey()
    )
  );

  // Auto-validate on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      const fileName = path.basename(doc.uri.fsPath);
      if (fileName === 'Skills.md' || fileName === 'Validation.md') {
        const result = validateSingleFile(doc.uri.fsPath);
        const errors = result.issues.filter(i => i.type === 'error').length;
        const warnings = result.issues.filter(i => i.type === 'warning').length;

        if (errors > 0) {
          const action = await vscode.window.showErrorMessage(
            `AI-SDLC: ${fileName} has ${errors} error(s) after save.`,
            'Show Details',
            'Open AI Assistant'
          );
          if (action === 'Show Details') {
            getOutputChannel().clear();
            getOutputChannel().appendLine(formatSingleFileResult(result));
            getOutputChannel().show();
          } else if (action === 'Open AI Assistant') {
            await showAiAssistPanel(context, doc.uri.fsPath);
          }
        } else if (warnings > 0) {
          vscode.window.showWarningMessage(
            `AI-SDLC: ${fileName} saved with ${warnings} warning(s). Run validate to see details.`
          );
        }
      }
    })
  );
}

export function deactivate(): void {
  outputChannel?.dispose();
}
