# AI-ULU

Universal Memory & Context Infrastructure for AI

```
One brain. Every AI. Everywhere.
```

## Install

```bash
pip install ai-ulu
```

## Quick Start

### CLI

```bash
export AI_ULU_API_KEY=ulu_full_xxx...

ulu ask "What's my favorite programming language?"
ulu remember "I prefer dark mode" --type preference
ulu search "projects"
ulu chat
```

### Python SDK

```python
from ai_ulu import AIULU

ulu = AIULU(api_key="ulu_full_xxx...")

# Query
result = ulu.ask("What do I like?")
print(result.answer)

# Store
ulu.remember("I love Python", type="preference")

# Search
results = ulu.search("programming")
for mem in results.memories:
    print(mem.content)
```

### LangChain

```python
from ai_ulu.langchain import AIULUMemory, AIULURetriever

# As conversation memory
memory = AIULUMemory()

# As retriever
retriever = AIULURetriever()
docs = retriever.get_relevant_documents("my preferences")
```

## API Keys

Get your key at [ai-ulu.com/settings](https://ai-ulu.com/settings)

| Scope | Permissions | Rate Limit |
|-------|-------------|------------|
| `read` | Query, Search | 60/min |
| `write` | + Create, Update | 30/min |
| `full` | + Delete | 100/min |

## Links

- [Documentation](https://docs.ai-ulu.com)
- [GitHub](https://github.com/agiulucom42-del/emergent-ai-ulu.com)
- [Discord](https://discord.gg/aiulu)

## License

MIT
