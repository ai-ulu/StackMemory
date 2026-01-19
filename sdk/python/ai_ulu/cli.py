#!/usr/bin/env python3
"""
AI-ULU CLI

Usage:
    ulu ask "What's my favorite color?"
    ulu remember "I prefer dark mode" --type preference
    ulu search "projects"
    ulu chat
    ulu status
"""

import os
import sys
import json
import argparse

from .client import AIULU, AIULUError
from .memory import MemoryType


# Colors
class C:
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    END = '\033[0m'


def color(text: str, c: str) -> str:
    if sys.stdout.isatty():
        return f"{c}{text}{C.END}"
    return text


def get_client():
    api_key = os.getenv("AI_ULU_API_KEY", "")
    base_url = os.getenv("AI_ULU_URL", "http://localhost:8080")
    return AIULU(api_key=api_key, base_url=base_url)


def cmd_ask(args):
    """Ask a question"""
    print(color("\n🧠 AI-ULU", C.CYAN), color("thinking...", C.DIM))
    
    try:
        client = get_client()
        result = client.ask(args.query)
        
        print(color("\n📝 Answer:", C.GREEN))
        print(f"   {result.answer}")
        
        if args.verbose and result.confidence:
            print(color(f"\n📊 Confidence: {result.confidence:.0%}", C.DIM))
    except AIULUError as e:
        print(color(f"\n❌ Error: {e.message}", C.RED))
        sys.exit(1)


def cmd_remember(args):
    """Save to memory"""
    print(color("\n💾 Saving...", C.CYAN))
    
    try:
        client = get_client()
        mem_type = MemoryType(args.type) if args.type else MemoryType.FACT
        
        result = client.remember(args.content, type=mem_type)
        
        print(color("✅ Saved!", C.GREEN))
        print(f"   Type: {color(args.type or 'fact', C.PURPLE)}")
        print(f"   Content: {args.content[:80]}{'...' if len(args.content) > 80 else ''}")
    except AIULUError as e:
        print(color(f"\n❌ Error: {e.message}", C.RED))
        sys.exit(1)


def cmd_search(args):
    """Search memories"""
    print(color(f"\n🔍 Searching: {args.query}", C.CYAN))
    
    try:
        client = get_client()
        results = client.search(args.query, limit=args.limit)
        
        if not results.memories:
            print(color("   No memories found.", C.YELLOW))
            return
        
        print(color(f"\n📚 Found {len(results.memories)} memories:", C.GREEN))
        
        for i, mem in enumerate(results.memories, 1):
            icon = {"identity": "👤", "preference": "💜", "fact": "📝"}.get(mem.type.value, "📄")
            content = mem.content[:80]
            print(f"   {i}. {icon} {content}{'...' if len(mem.content) > 80 else ''}")
    except AIULUError as e:
        print(color(f"\n❌ Error: {e.message}", C.RED))
        sys.exit(1)


def cmd_orchestrate(args):
    """MCP Hub query"""
    print(color("\n🌐 MCP Hub", C.CYAN), color("orchestrating...", C.DIM))
    
    try:
        client = get_client()
        result = client.orchestrate(args.query)
        
        print(color("\n📝 Answer:", C.GREEN))
        print(f"   {result.answer}")
        
        if args.verbose and result.sources:
            print(color(f"\n🔌 Sources: {len(result.sources)}", C.DIM))
    except AIULUError as e:
        print(color(f"\n❌ Error: {e.message}", C.RED))
        sys.exit(1)


def cmd_chat(args):
    """Interactive chat"""
    print(color("\n🧠 AI-ULU Chat", C.CYAN + C.BOLD))
    print(color("   Type 'exit' to quit, '/help' for commands\n", C.DIM))
    
    client = get_client()
    
    while True:
        try:
            user_input = input(color("You: ", C.GREEN)).strip()
        except (EOFError, KeyboardInterrupt):
            print(color("\n\n👋 Goodbye!", C.CYAN))
            break
        
        if not user_input:
            continue
        
        if user_input.lower() in ("exit", "quit", "/exit"):
            print(color("\n👋 Goodbye!", C.CYAN))
            break
        
        if user_input == "/help":
            print(color("\nCommands:", C.PURPLE))
            print("  /remember <text>  - Save to memory")
            print("  /search <query>   - Search memories")
            print("  /exit             - Exit chat")
            continue
        
        if user_input.startswith("/remember "):
            content = user_input[10:]
            try:
                client.remember(content)
                print(color("💾 Saved!", C.GREEN))
            except:
                print(color("❌ Failed to save", C.RED))
            continue
        
        if user_input.startswith("/search "):
            query = user_input[8:]
            try:
                results = client.search(query, limit=3)
                for mem in results.memories:
                    print(f"  • {mem.content[:60]}...")
            except:
                print(color("❌ Search failed", C.RED))
            continue
        
        try:
            result = client.ask(user_input)
            print(color(f"AI-ULU: ", C.CYAN) + result.answer + "\n")
        except AIULUError as e:
            print(color(f"Error: {e.message}", C.RED))


def cmd_status(args):
    """Check status"""
    print(color("\n🔌 Checking AI-ULU...", C.CYAN))
    
    client = get_client()
    
    if client.health():
        print(color("   ✅ Connected", C.GREEN))
    else:
        print(color("   ❌ Not reachable", C.RED))
    
    print(color("\n⚙️  Config:", C.PURPLE))
    print(f"   URL: {client.base_url}")
    print(f"   Key: {'✓ Set' if client.api_key else '✗ Not set'}")


def main():
    parser = argparse.ArgumentParser(
        prog="ulu",
        description="AI-ULU CLI - Universal AI Memory",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  ulu ask "What's my favorite food?"
  ulu remember "I love Python" --type preference
  ulu search "projects" --limit 5
  ulu chat

Environment:
  AI_ULU_API_KEY    API key (ulu_xxx_...)
  AI_ULU_URL        API URL (default: http://localhost:8080)
"""
    )
    
    parser.add_argument("--version", action="version", version="ai-ulu 1.0.0")
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # ask
    p = subparsers.add_parser("ask", help="Ask a question")
    p.add_argument("query", help="Your question")
    p.add_argument("-v", "--verbose", action="store_true")
    p.set_defaults(func=cmd_ask)
    
    # remember
    p = subparsers.add_parser("remember", help="Save to memory")
    p.add_argument("content", help="Content to save")
    p.add_argument("-t", "--type", choices=["identity", "preference", "fact"], default="fact")
    p.set_defaults(func=cmd_remember)
    
    # search
    p = subparsers.add_parser("search", help="Search memories")
    p.add_argument("query", help="Search query")
    p.add_argument("-l", "--limit", type=int, default=10)
    p.set_defaults(func=cmd_search)
    
    # orchestrate
    p = subparsers.add_parser("orchestrate", aliases=["hub"], help="MCP Hub query")
    p.add_argument("query", help="Query")
    p.add_argument("-v", "--verbose", action="store_true")
    p.set_defaults(func=cmd_orchestrate)
    
    # chat
    p = subparsers.add_parser("chat", help="Interactive chat")
    p.set_defaults(func=cmd_chat)
    
    # status
    p = subparsers.add_parser("status", help="Check connection")
    p.set_defaults(func=cmd_status)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    args.func(args)


if __name__ == "__main__":
    main()
