# 🧠 AI-ULU MCP Server

**Model Context Protocol (MCP) implementation for AI-ULU Universal Memory System**

Turn AI-ULU into the **universal memory layer** for all MCP-compatible AI applications.

## 🚀 What This Does

AI-ULU MCP Server allows any AI that supports the Model Context Protocol to access your personal AI memory:

- **Claude Desktop** - Your memories available in Claude
- **Cursor IDE** - Code with context awareness
- **Windsurf** - AI pair programming with memory
- **Any MCP Client** - Universal compatibility

## 📦 Installation

```bash
npm install -g @ai-ulu/mcp-server
```

Or use with npx:
```bash
npx @ai-ulu/mcp-server
```

## ⚙️ Configuration

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ai-ulu": {
      "command": "npx",
      "args": ["@ai-ulu/mcp-server"],
      "env": {
        "AI_ULU_API_URL": "https://your-ai-ulu-instance.com",
        "AI_ULU_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_ULU_API_URL` | Your AI-ULU instance URL | Yes |
| `AI_ULU_API_KEY` | API authentication key | Yes |
| `AI_ULU_USER_ID` | User ID (if using shared key) | No |

## 🛠️ Available Tools

### `search_memories`
Search your memories by semantic similarity.

```
Input: { query: "favorite programming language", limit: 5 }
Output: Relevant memories ranked by H(x,ψ) score
```

### `store_memory`
Store new information in your memory.

```
Input: { 
  content: "User prefers TypeScript over JavaScript",
  type: "preference",  // identity | preference | fact
  confidence: 0.9 
}
```

### `update_memory`
Update an existing memory.

```
Input: { id: "memory-uuid", content: "Updated content" }
```

### `delete_memory`
Delete a memory (moves to shadow archive).

```
Input: { id: "memory-uuid" }
```

### `query_memories`
Ask natural language questions about your memories.

```
Input: { question: "What programming languages does the user know?" }
Output: AI-generated answer based on memories
```

### `list_memories`
List all memories, optionally filtered.

```
Input: { type: "preference", limit: 10 }
```

### `get_memory_graph`
Get the memory relationship graph.

```
Input: { limit: 50 }
Output: Nodes, edges, and statistics
```

## 📚 Available Resources

Access your memories as MCP resources:

| URI | Description |
|-----|-------------|
| `memories://all` | All user memories |
| `memories://identity` | Identity memories (name, profession, etc.) |
| `memories://preferences` | Preference memories (likes/dislikes) |
| `memories://facts` | Fact memories (general info) |
| `memories://graph` | Memory relationship graph |
| `settings://memory` | Memory configuration |

## 💬 Available Prompts

### `remember_context`
Load user context before responding.

```
Arguments: { topic?: "programming" }
```

### `memory_aware_response`
Generate a response incorporating memories.

```
Arguments: { user_message: "What should I have for lunch?" }
```

### `summarize_memories`
Create a summary of user memories.

```
Arguments: { type?: "preference" }
```

## 🔒 Security

- All API communication uses HTTPS
- API keys are stored securely in environment variables
- Memory access respects user privacy settings
- Shadow delete ensures audit trail

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude/Cursor  │────▶│  AI-ULU MCP     │────▶│  AI-ULU API     │
│  (MCP Client)   │◀────│  Server         │◀────│  (Backend)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   H(x,ψ)        │
                        │   Algorithm     │
                        │   + Memory DB   │
                        └─────────────────┘
```

## 📖 Example Usage in Claude

Once configured, you can say things like:

> "Search my memories for anything about Python"
> 
> "Remember that I prefer dark mode in all applications"
> 
> "What do you know about my work preferences?"
> 
> "Show me my memory graph"

Claude will use the AI-ULU tools to access and update your personal memory.

## 🤝 Contributing

Contributions welcome! Please see our [Contributing Guide](../CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](../LICENSE)

---

**AI-ULU** - Your AI's Memory, Everywhere
