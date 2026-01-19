#!/usr/bin/env python3
"""
AI-ULU Slack Bot

Add AI-ULU memory to your Slack workspace.

Commands:
  @AI-ULU remember <text>  - Save to memory
  @AI-ULU ask <question>   - Query memory
  @AI-ULU search <query>   - Search memories
  
Setup:
  1. Create a Slack App at https://api.slack.com/apps
  2. Add Bot Token Scopes: app_mentions:read, chat:write, users:read
  3. Install to workspace
  4. Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET

Usage:
  export SLACK_BOT_TOKEN=xoxb-xxx
  export SLACK_SIGNING_SECRET=xxx
  python bot.py
"""

import os
import re
import logging
from typing import Optional

# Slack SDK
try:
    from slack_bolt import App
    from slack_bolt.adapter.socket_mode import SocketModeHandler
except ImportError:
    print("Install slack-bolt: pip install slack-bolt")
    exit(1)

# HTTP client for AI-ULU
import urllib.request
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-ulu-slack")

# =============================================================================
# Configuration
# =============================================================================

SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")
SLACK_SIGNING_SECRET = os.environ.get("SLACK_SIGNING_SECRET")
SLACK_APP_TOKEN = os.environ.get("SLACK_APP_TOKEN")  # For socket mode

AI_ULU_BRIDGE_URL = os.environ.get("AI_ULU_BRIDGE_URL", "http://localhost:8080")

if not SLACK_BOT_TOKEN:
    print("Error: SLACK_BOT_TOKEN not set")
    exit(1)

# Initialize Slack app
app = App(
    token=SLACK_BOT_TOKEN,
    signing_secret=SLACK_SIGNING_SECRET,
)

# =============================================================================
# AI-ULU Client
# =============================================================================

def ai_ulu_request(endpoint: str, data: dict) -> dict:
    """Make request to AI-ULU Bridge"""
    url = f"{AI_ULU_BRIDGE_URL}{endpoint}"
    
    headers = {
        "Content-Type": "application/json",
    }
    
    body = json.dumps(data).encode()
    
    try:
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        logger.error(f"AI-ULU request error: {e}")
        return {"success": False, "error": str(e)}

# =============================================================================
# Command Handlers
# =============================================================================

def handle_remember(text: str, user_id: str, channel: str) -> str:
    """Handle 'remember' command"""
    result = ai_ulu_request("/v1/memory", {
        "content": text,
        "type": "fact",
        "source": f"slack:{channel}",
        "metadata": {"slack_user": user_id},
    })
    
    if result.get("success"):
        return f":brain: Got it! I'll remember: _{text[:100]}{'...' if len(text) > 100 else ''}_"
    else:
        return f":x: Couldn't save that: {result.get('error', 'Unknown error')}"

def handle_ask(question: str, user_id: str) -> str:
    """Handle 'ask' command"""
    result = ai_ulu_request("/v1/query", {
        "query": question,
        "source": "slack",
        "user_id": user_id,
    })
    
    if result.get("success"):
        data = result.get("data", {})
        answer = data.get("answer", "I don't have an answer for that.")
        confidence = data.get("confidence", 0)
        
        response = f":brain: {answer}"
        
        if confidence > 0:
            confidence_emoji = ":star:" if confidence > 0.7 else ":sparkles:" if confidence > 0.4 else ":thought_balloon:"
            response += f"\n{confidence_emoji} Confidence: {confidence:.0%}"
        
        return response
    else:
        return f":thinking_face: I couldn't find an answer. Error: {result.get('error', 'Unknown')}"

def handle_search(query: str) -> str:
    """Handle 'search' command"""
    result = ai_ulu_request("/v1/search", {
        "query": query,
        "limit": 5,
    })
    
    if result.get("success"):
        memories = result.get("data", {}).get("memories", [])
        
        if not memories:
            return f":mag: No memories found for: _{query}_"
        
        response = f":mag: Found {len(memories)} memories:\n"
        
        for i, mem in enumerate(memories, 1):
            type_emoji = {
                "identity": ":bust_in_silhouette:",
                "preference": ":purple_heart:",
                "fact": ":page_facing_up:",
            }.get(mem.get("type", ""), ":memo:")
            
            content = mem.get("content", "")[:80]
            response += f"{i}. {type_emoji} {content}{'...' if len(mem.get('content', '')) > 80 else ''}\n"
        
        return response
    else:
        return f":x: Search error: {result.get('error', 'Unknown')}"

def handle_orchestrate(query: str, user_id: str) -> str:
    """Handle 'hub' or 'orchestrate' command - full MCP Hub query"""
    result = ai_ulu_request("/v1/orchestrate", {
        "query": query,
        "source": "slack",
        "user_id": user_id,
    })
    
    if result.get("success"):
        data = result.get("data", {})
        synth = data.get("synthesized", {})
        answer = synth.get("answer", "No answer found.")
        sources = synth.get("sources", [])
        
        response = f":globe_with_meridians: *MCP Hub Result:*\n{answer}"
        
        if sources:
            source_names = [s.get("name", "Unknown") for s in sources]
            response += f"\n\n:electric_plug: _Sources: {', '.join(source_names)}_"
        
        return response
    else:
        return f":x: Orchestration error: {result.get('error', 'Unknown')}"

# =============================================================================
# Slack Event Handlers
# =============================================================================

@app.event("app_mention")
def handle_mention(event, say, client):
    """Handle @AI-ULU mentions"""
    text = event.get("text", "")
    user = event.get("user", "")
    channel = event.get("channel", "")
    
    # Remove the bot mention from the text
    clean_text = re.sub(r"<@[A-Z0-9]+>", "", text).strip()
    
    # Parse command
    lower_text = clean_text.lower()
    
    if lower_text.startswith("remember "):
        content = clean_text[9:].strip()
        response = handle_remember(content, user, channel)
    
    elif lower_text.startswith("ask "):
        question = clean_text[4:].strip()
        response = handle_ask(question, user)
    
    elif lower_text.startswith("search "):
        query = clean_text[7:].strip()
        response = handle_search(query)
    
    elif lower_text.startswith("hub ") or lower_text.startswith("orchestrate "):
        query = clean_text.split(" ", 1)[1].strip() if " " in clean_text else ""
        response = handle_orchestrate(query, user)
    
    elif lower_text == "help":
        response = (
            ":brain: *AI-ULU Commands:*\n"
            "• `@AI-ULU remember <text>` - Save something to memory\n"
            "• `@AI-ULU ask <question>` - Query your memories\n"
            "• `@AI-ULU search <keywords>` - Search through memories\n"
            "• `@AI-ULU hub <query>` - Query MCP Hub (memory + web + more)\n"
            "• `@AI-ULU help` - Show this help"
        )
    
    elif lower_text == "status":
        response = f":white_check_mark: AI-ULU is connected!\nBridge: `{AI_ULU_BRIDGE_URL}`"
    
    else:
        # Default: treat as a question
        if clean_text:
            response = handle_ask(clean_text, user)
        else:
            response = "Hi! Mention me with a question or use `@AI-ULU help` for commands."
    
    say(response)

@app.event("message")
def handle_message(event, say):
    """Handle direct messages"""
    # Only handle DMs (no channel subtype)
    if event.get("channel_type") != "im":
        return
    
    if event.get("bot_id"):  # Ignore bot messages
        return
    
    text = event.get("text", "")
    user = event.get("user", "")
    
    # In DMs, treat everything as a question
    response = handle_ask(text, user)
    say(response)

# =============================================================================
# Slash Commands (Optional)
# =============================================================================

@app.command("/ulu")
def handle_slash_command(ack, command, respond):
    """Handle /ulu slash command"""
    ack()
    
    text = command.get("text", "").strip()
    user = command.get("user_id", "")
    
    if not text:
        respond(":brain: Usage: `/ulu <your question>`")
        return
    
    response = handle_ask(text, user)
    respond(response)

@app.command("/remember")
def handle_remember_command(ack, command, respond):
    """Handle /remember slash command"""
    ack()
    
    text = command.get("text", "").strip()
    user = command.get("user_id", "")
    channel = command.get("channel_id", "")
    
    if not text:
        respond(":brain: Usage: `/remember <something to remember>`")
        return
    
    response = handle_remember(text, user, channel)
    respond(response)

# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    logger.info("Starting AI-ULU Slack Bot...")
    logger.info(f"Bridge URL: {AI_ULU_BRIDGE_URL}")
    
    if SLACK_APP_TOKEN:
        # Socket Mode (recommended for development)
        handler = SocketModeHandler(app, SLACK_APP_TOKEN)
        handler.start()
    else:
        # HTTP Mode (for production with public URL)
        app.start(port=int(os.environ.get("PORT", 3000)))
