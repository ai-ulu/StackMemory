export const workflowLabels = {
  claude_code: 'Claude Code',
  cursor: 'Cursor',
  codex: 'Codex',
  replit: 'Replit',
  custom_app: 'Custom App / n8n',
};

export function getWorkflowLabel(workflow) {
  return workflowLabels[workflow] || 'AI workflow';
}
