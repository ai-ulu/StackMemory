# StackMemory Python SDK

Python client for the StackMemory bridge and memory API.

## Install

```bash
pip install ai-ulu
```

The package name is still backward-compatible for now.

## Quick Start

```python
from ai_ulu import AIULU

client = AIULU(api_key="ulu_full_xxx...")

result = client.ask("What project constraints have I already defined?")
print(result.answer)

client.remember("Prefer TypeScript and small diffs", type="preference")
```

## Intended Use

Use the SDK when you want to:
- add persistent developer memory to your own AI app
- store user preferences and project decisions
- retrieve shared context across agent workflows
- connect a custom coding assistant to the same memory layer

## Current Compatibility

- `AIULU` client class name is still preserved
- `AI_ULU_API_KEY` and related env vars are still supported
- branding is moving to StackMemory without breaking existing integrations
