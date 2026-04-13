# Handshake Protocol: Agent Handoff Guidelines

To ensure the "Sequential Flow" ($BA \to Dev \to QA$) works without loss of context, every agent must follow this protocol.

## 🤝 The "Context Handshake"
When one agent finishes their task and triggers the next, they MUST provide:
1.  **Summary of Work Done**: A brief sentence explaining the primary achievement.
2.  **Required Inputs**: The specific files/data that the *next* agent needs.
3.  **Known Blockers**: Any unresolved issues or assumptions made during this phase.

## 📁 Transfer File Format
Each handoff should be accompanied by a `handoff.json` or a Markdown file containing:
- `previous_agent`: [Role]
- `next_agent`: [Role]
- `context_payload`: [Key-Value pairs or File paths]

## 🛑 Rejection Condition
An agent can **REJECT** a handoff if:
- Required inputs are missing or malformed.
- The output from the previous stage has not been validated by the "Global Rules" agent.
- There is a clear hallucination or contradiction in the provided context.

