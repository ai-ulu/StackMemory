"""
AI-ULU Memory Types
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime


class MemoryType(Enum):
    """Types of memories"""
    IDENTITY = "identity"    # Who you are (name, job, etc.)
    PREFERENCE = "preference"  # What you like
    FACT = "fact"           # General information


@dataclass
class Memory:
    """
    A memory item.
    
    Attributes:
        id: Unique identifier
        content: The memory content
        type: Memory type (identity, preference, fact)
        created_at: When the memory was created
        score: Relevance score (for search results)
        metadata: Additional metadata
    """
    id: str
    content: str
    type: MemoryType = MemoryType.FACT
    created_at: Optional[str] = None
    score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)
    
    def __str__(self) -> str:
        return f"[{self.type.value}] {self.content[:50]}{'...' if len(self.content) > 50 else ''}"
    
    def __repr__(self) -> str:
        return f"Memory(id='{self.id}', type={self.type}, content='{self.content[:30]}...')"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "content": self.content,
            "type": self.type.value,
            "created_at": self.created_at,
            "score": self.score,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Memory":
        """Create from dictionary"""
        return cls(
            id=data.get("id", ""),
            content=data.get("content", ""),
            type=MemoryType(data.get("type", "fact")),
            created_at=data.get("created_at"),
            score=data.get("score"),
            metadata=data.get("metadata", {}),
        )
