export const mockWorkflows = [
  {
    id: 'coding-session-handoff',
    name: 'Coding session handoff',
    description: 'Move decisions and active context between coding tools.',
    steps: ['Read recent memories', 'Compile context', 'Send to selected agent', 'Write back decisions'],
  },
  {
    id: 'project-rule-capture',
    name: 'Project rule capture',
    description: 'Capture durable rules and constraints as reusable memories.',
    steps: ['Detect rule', 'Store as memory', 'Tag namespace', 'Expose in Brain preview'],
  },
  {
    id: 'context-preview-before-agent-run',
    name: 'Context preview before agent run',
    description: 'Preview selected memories before a high-impact agent action.',
    steps: ['Choose agent', 'Set token budget', 'Rank memories', 'Approve context'],
  },
  {
    id: 'post-run-memory-writeback',
    name: 'Post-run memory writeback',
    description: 'Save important outputs from an agent run back into memory.',
    steps: ['Summarize run', 'Detect decisions', 'Store insights', 'Update confidence'],
  },
];

export function getWorkflowById(id) {
  return mockWorkflows.find((workflow) => workflow.id === id) || null;
}
