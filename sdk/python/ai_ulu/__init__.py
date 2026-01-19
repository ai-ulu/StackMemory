"""
AI-ULU - Universal Memory & Context Infrastructure for AI

One brain. Every AI. Everywhere.

Usage:
    from ai_ulu import AIULU
    
    ulu = AIULU(api_key="ulu_xxx_...")
    ulu.ask("What's my favorite color?")
    ulu.remember("I love Python", type="preference")
    
CLI:
    pip install ai-ulu
    ulu ask "..."
"""

__version__ = "1.0.0"
__author__ = "AI-ULU Team"

from .client import AIULU, AIULUError
from .memory import Memory, MemoryType

__all__ = ["AIULU", "AIULUError", "Memory", "MemoryType", "__version__"]
