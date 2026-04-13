# RAG Context Rules

These rules define how agents must use the RAG (Retrieval-Augmented Generation) layer.

## What RAG Provides
- Company SOPs (Standard Operating Procedures)
- Coding standards and best practices
- Project-specific context and history

## When to Use RAG
- RequirementAgent: fetch relevant SOPs before writing BA document
- ArchitectureAgent: fetch coding standards before designing tech stack
- DeveloperAgent: fetch project context before generating code
- QAAgent: fetch testing standards before writing test cases

## Rules
1. Always check RAG before generating output — do not rely on model memory alone
2. If RAG returns no results, proceed with general knowledge and flag it
3. Never inject full RAG documents — inject only relevant sections
4. RAG context must be marked separately in the prompt as [RAG_CONTEXT]
5. If RAG context conflicts with user input — user input takes priority