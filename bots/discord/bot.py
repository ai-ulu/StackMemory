#!/usr/bin/env python3
"""
AI-ULU Discord Bot

Add AI-ULU memory to your Discord server.

Commands:
  !ulu ask <question>     - Query memory
  !ulu remember <text>    - Save to memory
  !ulu search <query>     - Search memories
  !ulu hub <query>        - MCP Hub query

Setup:
  1. Create a Discord App at https://discord.com/developers/applications
  2. Create a Bot and get the token
  3. Invite bot to server with appropriate permissions
  4. Set DISCORD_TOKEN environment variable

Usage:
  export DISCORD_TOKEN=xxx
  python bot.py
"""

import os
import logging
import urllib.request
import json
from typing import Optional

# Discord.py
try:
    import discord
    from discord.ext import commands
except ImportError:
    print("Install discord.py: pip install discord.py")
    exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-ulu-discord")

# =============================================================================
# Configuration
# =============================================================================

DISCORD_TOKEN = os.environ.get("DISCORD_TOKEN")
AI_ULU_BRIDGE_URL = os.environ.get("AI_ULU_BRIDGE_URL", "http://localhost:8080")
COMMAND_PREFIX = os.environ.get("COMMAND_PREFIX", "!ulu ")

if not DISCORD_TOKEN:
    print("Error: DISCORD_TOKEN not set")
    exit(1)

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix=COMMAND_PREFIX, intents=intents)

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
# Bot Events
# =============================================================================

@bot.event
async def on_ready():
    logger.info(f"AI-ULU Discord Bot is ready!")
    logger.info(f"Logged in as {bot.user}")
    logger.info(f"Bridge URL: {AI_ULU_BRIDGE_URL}")
    
    # Set bot status
    await bot.change_presence(
        activity=discord.Activity(
            type=discord.ActivityType.listening,
            name=f"{COMMAND_PREFIX}help"
        )
    )

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        await ctx.send("Unknown command. Use `!ulu help` for available commands.")
    else:
        logger.error(f"Command error: {error}")

# =============================================================================
# Commands
# =============================================================================

@bot.command(name="ask", aliases=["q", "query"])
async def cmd_ask(ctx, *, question: str):
    """Ask a question to AI-ULU memory"""
    async with ctx.typing():
        result = ai_ulu_request("/v1/query", {
            "query": question,
            "source": f"discord:{ctx.guild.id if ctx.guild else 'dm'}",
            "user_id": str(ctx.author.id),
        })
    
    if result.get("success"):
        data = result.get("data", {})
        answer = data.get("answer", "I don't have an answer for that.")
        confidence = data.get("confidence", 0)
        
        # Create embed
        embed = discord.Embed(
            title="🧠 AI-ULU Memory",
            description=answer,
            color=discord.Color.purple()
        )
        
        if confidence > 0:
            embed.set_footer(text=f"Confidence: {confidence:.0%}")
        
        await ctx.send(embed=embed)
    else:
        await ctx.send(f"❌ Error: {result.get('error', 'Unknown error')}")

@bot.command(name="remember", aliases=["save", "store"])
async def cmd_remember(ctx, *, content: str):
    """Save something to AI-ULU memory"""
    # Detect memory type from content
    lower_content = content.lower()
    
    if any(p in lower_content for p in ["i am", "my name", "i work", "i live"]):
        mem_type = "identity"
    elif any(p in lower_content for p in ["i like", "i love", "i prefer", "i hate", "favorite"]):
        mem_type = "preference"
    else:
        mem_type = "fact"
    
    result = ai_ulu_request("/v1/memory", {
        "content": content,
        "type": mem_type,
        "source": f"discord:{ctx.guild.id if ctx.guild else 'dm'}",
        "metadata": {
            "discord_user": str(ctx.author.id),
            "discord_username": str(ctx.author),
        },
    })
    
    if result.get("success"):
        type_emoji = {"identity": "👤", "preference": "💜", "fact": "📝"}.get(mem_type, "📄")
        await ctx.send(f"{type_emoji} Saved to memory: *{content[:100]}{'...' if len(content) > 100 else ''}*")
    else:
        await ctx.send(f"❌ Couldn't save: {result.get('error', 'Unknown error')}")

@bot.command(name="search", aliases=["find"])
async def cmd_search(ctx, *, query: str):
    """Search through memories"""
    async with ctx.typing():
        result = ai_ulu_request("/v1/search", {
            "query": query,
            "limit": 5,
        })
    
    if result.get("success"):
        memories = result.get("data", {}).get("memories", [])
        
        if not memories:
            await ctx.send(f"🔍 No memories found for: *{query}*")
            return
        
        embed = discord.Embed(
            title=f"🔍 Search: {query}",
            description=f"Found {len(memories)} memories",
            color=discord.Color.blue()
        )
        
        for i, mem in enumerate(memories, 1):
            type_emoji = {"identity": "👤", "preference": "💜", "fact": "📝"}.get(mem.get("type", ""), "📄")
            content = mem.get("content", "")[:100]
            embed.add_field(
                name=f"{i}. {type_emoji} {mem.get('type', 'unknown').title()}",
                value=content + ("..." if len(mem.get("content", "")) > 100 else ""),
                inline=False
            )
        
        await ctx.send(embed=embed)
    else:
        await ctx.send(f"❌ Search error: {result.get('error', 'Unknown')}")

@bot.command(name="hub", aliases=["orchestrate", "full"])
async def cmd_hub(ctx, *, query: str):
    """Query MCP Hub for comprehensive answers"""
    async with ctx.typing():
        result = ai_ulu_request("/v1/orchestrate", {
            "query": query,
            "source": "discord",
            "user_id": str(ctx.author.id),
        })
    
    if result.get("success"):
        data = result.get("data", {})
        synth = data.get("synthesized", {})
        answer = synth.get("answer", "No answer found.")
        sources = synth.get("sources", [])
        latency = result.get("latency_ms", 0)
        
        embed = discord.Embed(
            title="🌐 MCP Hub Result",
            description=answer[:4000],  # Discord limit
            color=discord.Color.green()
        )
        
        if sources:
            source_names = [s.get("name", "Unknown") for s in sources]
            embed.add_field(
                name="🔌 Sources",
                value=", ".join(source_names),
                inline=False
            )
        
        embed.set_footer(text=f"Latency: {latency}ms")
        
        await ctx.send(embed=embed)
    else:
        await ctx.send(f"❌ Error: {result.get('error', 'Unknown')}")

@bot.command(name="status")
async def cmd_status(ctx):
    """Check AI-ULU connection status"""
    try:
        url = f"{AI_ULU_BRIDGE_URL}/health"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            
            if data.get("status") == "healthy":
                embed = discord.Embed(
                    title="✅ AI-ULU Status",
                    description="Connected and healthy!",
                    color=discord.Color.green()
                )
                embed.add_field(name="Bridge URL", value=f"`{AI_ULU_BRIDGE_URL}`", inline=False)
                await ctx.send(embed=embed)
            else:
                await ctx.send("⚠️ AI-ULU is responding but may have issues.")
    except Exception as e:
        await ctx.send(f"❌ Cannot reach AI-ULU: {e}")

@bot.command(name="help")
async def cmd_help_custom(ctx):
    """Show help message"""
    embed = discord.Embed(
        title="🧠 AI-ULU Discord Bot",
        description="Your AI memory assistant",
        color=discord.Color.purple()
    )
    
    commands_list = [
        ("`!ulu ask <question>`", "Query your memories"),
        ("`!ulu remember <text>`", "Save something to memory"),
        ("`!ulu search <query>`", "Search through memories"),
        ("`!ulu hub <query>`", "Query MCP Hub (memory + web + more)"),
        ("`!ulu status`", "Check connection status"),
    ]
    
    for cmd, desc in commands_list:
        embed.add_field(name=cmd, value=desc, inline=False)
    
    embed.set_footer(text="One brain, everywhere.")
    
    await ctx.send(embed=embed)

# =============================================================================
# DM Handler
# =============================================================================

@bot.event
async def on_message(message):
    # Ignore bot messages
    if message.author.bot:
        return
    
    # Process commands first
    await bot.process_commands(message)
    
    # Handle DMs without prefix
    if isinstance(message.channel, discord.DMChannel):
        content = message.content.strip()
        
        # Skip if it's a command
        if content.startswith(COMMAND_PREFIX):
            return
        
        # Treat as a question
        if content:
            async with message.channel.typing():
                result = ai_ulu_request("/v1/query", {
                    "query": content,
                    "source": "discord:dm",
                    "user_id": str(message.author.id),
                })
            
            if result.get("success"):
                answer = result.get("data", {}).get("answer", "I'm not sure about that.")
                await message.channel.send(f"🧠 {answer}")
            else:
                await message.channel.send("I couldn't find an answer. Try rephrasing?")

# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    logger.info("Starting AI-ULU Discord Bot...")
    bot.run(DISCORD_TOKEN)
