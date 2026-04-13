// ── aiAssistant.ts — Phase 2: AI-powered agent creation assistant ────────────
// Uses OpenRouter free models (no cost)

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AI_PROJECT_CONTEXT } from './rules';
import { extractAgentName, validateSingleFile } from './validator';

// ── OpenRouter free models (no billing required) ─────────────────────────────
const FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
];

// ── Call OpenRouter API ───────────────────────────────────────────────────────
async function callOpenRouter(
  apiKey: string,
  messages: { role: string; content: string }[],
  model: string = FREE_MODELS[0]
): Promise<string> {
  const https = await import('https');

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.3,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ai-sdlc-playbook',
        'X-Title': 'AI-SDLC Playbook Validator',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            // Try next free model if rate limited
            reject(new Error(parsed.error.message || 'API Error'));
          } else {
            resolve(parsed.choices?.[0]?.message?.content || '');
          }
        } catch {
          reject(new Error('Failed to parse API response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Try multiple free models ──────────────────────────────────────────────────
async function callWithFallback(
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  for (const model of FREE_MODELS) {
    try {
      const result = await callOpenRouter(apiKey, messages, model);
      if (result) return result;
    } catch (err: any) {
      if (err.message?.includes('rate') || err.message?.includes('quota')) {
        continue; // Try next model
      }
      throw err;
    }
  }
  throw new Error('All free models are currently rate-limited. Please try again in a moment.');
}

// ── Get API key from settings or prompt user ──────────────────────────────────
async function getApiKey(): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration('sdlcValidator');
  let apiKey = config.get<string>('openrouterApiKey') || '';

  if (!apiKey) {
    apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your OpenRouter API key (free at openrouter.ai)',
      placeHolder: 'sk-or-v1-...',
      password: true,
      ignoreFocusOut: true,
    }) || '';

    if (apiKey) {
      await config.update('openrouterApiKey', apiKey, true);
      vscode.window.showInformationMessage('API key saved! Using free OpenRouter models.');
    }
  }
  return apiKey || undefined;
}

// ── Detect context from file path ─────────────────────────────────────────────
function detectContext(filePath: string): {
  agentName: string;
  fileType: string;
  category: string;
  isSubAgent: boolean;
  parentAgent: string;
} {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const fileName = path.basename(filePath);
  const agentFolder = path.basename(path.dirname(filePath));

  // Detect category
  let category = 'CoreAgent';
  if (parts.includes('CommonAgent')) category = 'CommonAgent';
  else if (parts.includes('MasterAgent')) category = 'MasterAgent';

  // Detect if sub-agent
  const isSubAgent = parts.includes('subagents');
  const parentAgent = isSubAgent
    ? parts[parts.indexOf('subagents') - 1]
    : '';

  // Try to read existing agent name
  let agentName = agentFolder;
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const extracted = extractAgentName(content);
    if (extracted) agentName = extracted;
  }

  return {
    agentName,
    fileType: fileName.replace('.md', ''),
    category,
    isSubAgent,
    parentAgent,
  };
}

// ── Build prompt for Skills.md help ──────────────────────────────────────────
function buildSkillsPrompt(ctx: ReturnType<typeof detectContext>, currentContent: string): string {
  return `${AI_PROJECT_CONTEXT}

CURRENT FILE: ${ctx.agentName}/Skills.md
AGENT CATEGORY: ${ctx.category}
IS SUB-AGENT: ${ctx.isSubAgent}
${ctx.isSubAgent ? `PARENT AGENT: ${ctx.parentAgent}` : ''}

CURRENT FILE CONTENT:
\`\`\`
${currentContent || '(empty)'}
\`\`\`

TASK:
1. Identify exactly which required sections are missing or empty
2. For each missing/empty section, generate the appropriate content for this specific agent
3. Consider the agent's role and category when generating content
4. Follow all README governance rules strictly

RESPONSE FORMAT:
Start with a brief analysis of what's missing, then provide the complete suggested content for each missing section in this format:

### Missing: ## Section Name
\`\`\`
[suggested content here]
\`\`\`

Be specific to this agent's role — not generic placeholder text.
End with: "How many sub-agents would be appropriate for ${ctx.agentName}? [your recommendation with reasoning]"`;
}

// ── Build prompt for Validation.md help ──────────────────────────────────────
function buildValidationPrompt(ctx: ReturnType<typeof detectContext>, currentContent: string, skillsContent?: string): string {
  return `${AI_PROJECT_CONTEXT}

CURRENT FILE: ${ctx.agentName}/Validation.md
AGENT CATEGORY: ${ctx.category}

${skillsContent ? `RELATED SKILLS.MD CONTENT:
\`\`\`
${skillsContent}
\`\`\`` : ''}

CURRENT VALIDATION.MD CONTENT:
\`\`\`
${currentContent || '(empty)'}
\`\`\`

TASK:
1. Identify which required sections are missing or empty in Validation.md
2. Generate appropriate MUST PASS checklist items specific to ${ctx.agentName}'s outputs
3. Generate QUALITY CHECKS relevant to this agent's domain
4. Add proper Self-Healing Rules with retry count
5. Add Human Approval Gate with correct checkpoint label

RESPONSE FORMAT:
Brief analysis first, then for each section:

### Missing/Empty: ## Section Name
\`\`\`
[suggested content with checkboxes]
\`\`\`

Make the MUST PASS items specific to what ${ctx.agentName} actually produces.`;
}

// ── AI Panel UI ───────────────────────────────────────────────────────────────
export async function showAiAssistPanel(context: vscode.ExtensionContext, filePath?: string): Promise<void> {

  // Get file path
  if (!filePath) {
    const editor = vscode.window.activeTextEditor;
    filePath = editor?.document.uri.fsPath;
  }

  if (!filePath) {
    vscode.window.showErrorMessage('AI-SDLC: Open a Skills.md or Validation.md file first.');
    return;
  }

  const fileName = path.basename(filePath);
  if (fileName !== 'Skills.md' && fileName !== 'Validation.md') {
    vscode.window.showErrorMessage('AI-SDLC: AI Assistant only works with Skills.md or Validation.md files.');
    return;
  }

  // Get API key
  const apiKey = await getApiKey();
  if (!apiKey) {
    vscode.window.showWarningMessage('AI-SDLC: API key required. Get a free key at openrouter.ai');
    return;
  }

  // Read current content
  const currentContent = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf-8')
    : '';

  // Detect context
  const ctx = detectContext(filePath);

  // Run validator first to show what's missing
  const validationResult = fs.existsSync(filePath)
    ? validateSingleFile(filePath)
    : null;

  const errors = validationResult?.issues.filter(i => i.type === 'error') || [];
  const warnings = validationResult?.issues.filter(i => i.type === 'warning') || [];

  // Create webview panel
  const panel = vscode.window.createWebviewPanel(
    'sdlcAiAssistant',
    `AI Assistant — ${ctx.agentName}/${fileName}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  // Build initial HTML
  panel.webview.html = getWebviewHtml(
    ctx.agentName,
    fileName,
    ctx.category,
    ctx.isSubAgent,
    ctx.parentAgent,
    errors,
    warnings
  );

  // Handle messages from webview
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === 'askAI') {
      panel.webview.postMessage({ command: 'setLoading', value: true });

      try {
        // Read Skills.md if we're working on Validation.md
        let skillsContent: string | undefined;
        if (fileName === 'Validation.md') {
          const skillsPath = path.join(path.dirname(filePath!), 'Skills.md');
          if (fs.existsSync(skillsPath)) {
            skillsContent = fs.readFileSync(skillsPath, 'utf-8');
          }
        }

        const userQuestion = message.text;
        const systemPrompt = AI_PROJECT_CONTEXT;

        // Build context-aware messages
        const contextPrompt = fileName === 'Skills.md'
          ? buildSkillsPrompt(ctx, currentContent)
          : buildValidationPrompt(ctx, currentContent, skillsContent);

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextPrompt },
          ...(userQuestion !== '__AUTO__' ? [{ role: 'user', content: userQuestion }] : []),
        ];

        const response = await callWithFallback(apiKey!, messages);
        panel.webview.postMessage({ command: 'setResponse', value: response });

      } catch (err: any) {
        panel.webview.postMessage({
          command: 'setError',
          value: err.message || 'Unknown error'
        });
      } finally {
        panel.webview.postMessage({ command: 'setLoading', value: false });
      }
    }
  });

  // Auto-analyze on open
  setTimeout(() => {
    panel.webview.postMessage({ command: 'autoAnalyze' });
  }, 500);
}

// ── Webview HTML ──────────────────────────────────────────────────────────────
function getWebviewHtml(
  agentName: string,
  fileName: string,
  category: string,
  isSubAgent: boolean,
  parentAgent: string,
  errors: any[],
  warnings: any[]
): string {
  const errorItems = errors.map(e =>
    `<li class="err">❌ <b>${e.category}:</b> ${e.message}<br><span class="fix">→ Fix: ${e.fix}</span></li>`
  ).join('');

  const warningItems = warnings.map(w =>
    `<li class="warn">⚠️ <b>${w.category}:</b> ${w.message}<br><span class="fix">→ Fix: ${w.fix}</span></li>`
  ).join('');

  const subAgentBadge = isSubAgent
    ? `<span class="badge sub">Sub-Agent of ${parentAgent}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--vscode-font-family); font-size: 13px; color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px; }
  h1 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: 600; margin: 12px 0 6px; color: var(--vscode-textLink-foreground); }
  .header { border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 12px; margin-bottom: 12px; }
  .meta { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 4px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; margin-right: 6px; }
  .badge.core { background: #1652 99; color: #fff; }
  .badge.common { background: #0F9E75; color: #fff; }
  .badge.master { background: #884EA0; color: #fff; }
  .badge.sub { background: #BA7517; color: #fff; }
  .badge.file { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
  .issues { background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; }
  .issues ul { list-style: none; }
  .issues li { padding: 5px 0; border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; }
  .issues li:last-child { border: none; }
  .err { color: var(--vscode-errorForeground, #f44); }
  .warn { color: var(--vscode-editorWarning-foreground, #e8a); }
  .fix { font-size: 11px; color: var(--vscode-descriptionForeground); margin-left: 16px; }
  .ai-section { margin-top: 12px; }
  textarea { width: 100%; min-height: 60px; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; font-family: inherit; font-size: 12px; resize: vertical; }
  .btn-row { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
  button { padding: 6px 14px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
  button:hover { background: var(--vscode-button-hoverBackground); }
  button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
  .response-box { margin-top: 12px; background: var(--vscode-textBlockQuote-background); border-left: 3px solid var(--vscode-textLink-foreground); padding: 10px 12px; border-radius: 0 4px 4px 0; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; }
  .loading { color: var(--vscode-descriptionForeground); font-style: italic; }
  .error-msg { color: var(--vscode-errorForeground); padding: 8px; background: var(--vscode-inputValidation-errorBackground); border-radius: 4px; }
  .summary-row { display: flex; gap: 12px; margin-bottom: 8px; font-size: 12px; }
  .count-err { color: var(--vscode-errorForeground); font-weight: 600; }
  .count-warn { color: var(--vscode-editorWarning-foreground); font-weight: 600; }
  .count-ok { color: #0F9E75; font-weight: 600; }
  .quick-btns { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }
  .quick-btns button { font-size: 11px; padding: 4px 10px; }
</style>
</head>
<body>

<div class="header">
  <h1>🤖 AI-SDLC Assistant</h1>
  <div class="meta">
    <span class="badge ${category === 'CoreAgent' ? 'core' : category === 'CommonAgent' ? 'common' : 'master'}">${category}</span>
    ${subAgentBadge}
    <span class="badge file">${fileName}</span>
    <b>${agentName}</b>
  </div>
</div>

<div class="summary-row">
  ${errors.length > 0
    ? `<span class="count-err">❌ ${errors.length} error(s)</span>`
    : `<span class="count-ok">✅ No errors</span>`}
  ${warnings.length > 0
    ? `<span class="count-warn">⚠️ ${warnings.length} warning(s)</span>`
    : ''}
</div>

${errors.length > 0 || warnings.length > 0 ? `
<div class="issues">
  <h2>Validation Issues Found</h2>
  <ul>
    ${errorItems}
    ${warningItems}
  </ul>
</div>
` : '<p style="color:#0F9E75;margin-bottom:12px">✅ This file passes all validation checks!</p>'}

<div class="ai-section">
  <h2>Ask AI Assistant</h2>
  <p style="font-size:11px;color:var(--vscode-descriptionForeground);margin-bottom:8px">
    AI knows your project context, agent rules, and README standards. Ask anything about this file.
  </p>

  <div class="quick-btns">
    <button class="secondary" onclick="ask('Fill in all missing sections for this file based on the agent role')">
      Auto-fill missing sections
    </button>
    <button class="secondary" onclick="ask('How many sub-agents should ${agentName} have? What should they be called?')">
      Sub-agent recommendations
    </button>
    <button class="secondary" onclick="ask('What MUST PASS checks should ${agentName} have in Validation.md?')">
      Suggest MUST PASS items
    </button>
    <button class="secondary" onclick="ask('What failure scenarios should ${agentName} handle?')">
      Failure scenarios
    </button>
    <button class="secondary" onclick="ask('Is the model configuration for ${agentName} correct? What should it be?')">
      Model config advice
    </button>
  </div>

  <textarea id="userInput" placeholder="Ask anything... e.g. 'What inputs should ${agentName} accept?' or 'Write the System Message for this agent'"></textarea>
  <div class="btn-row">
    <button onclick="askCustom()">Ask AI</button>
    <button class="secondary" onclick="autoAnalyze()">Auto-analyze this file</button>
  </div>
</div>

<div id="responseArea"></div>

<script>
  const vscode = acquireVsCodeApi();
  const responseArea = document.getElementById('responseArea');

  function ask(question) {
    showLoading();
    vscode.postMessage({ command: 'askAI', text: question });
  }

  function askCustom() {
    const input = document.getElementById('userInput').value.trim();
    if (!input) return;
    showLoading();
    vscode.postMessage({ command: 'askAI', text: input });
  }

  function autoAnalyze() {
    showLoading();
    vscode.postMessage({ command: 'askAI', text: '__AUTO__' });
  }

  function showLoading() {
    responseArea.innerHTML = '<div class="response-box"><span class="loading">🤔 AI is analyzing your file...</span></div>';
  }

  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.command === 'setResponse') {
      // Convert markdown code blocks to readable format
      let html = msg.value
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\`\`\`[a-z]*/g, '<code>').replace(/\`\`\`/g, '</code>')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/###\\s*(.+)/g, '<h3 style="color:var(--vscode-textLink-foreground);margin:8px 0 4px">$1</h3>')
        .replace(/##\\s*(.+)/g, '<h2>$1</h2>');
      responseArea.innerHTML = '<div class="response-box">' + html + '</div>';
    }
    if (msg.command === 'setError') {
      responseArea.innerHTML = '<div class="error-msg">❌ ' + msg.value + '</div>';
    }
    if (msg.command === 'setLoading') {
      if (msg.value) showLoading();
    }
    if (msg.command === 'autoAnalyze') {
      autoAnalyze();
    }
  });
</script>
</body>
</html>`;
}
