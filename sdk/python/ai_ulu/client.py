"""
StackMemory Python Client

Main client for interacting with the StackMemory API.
"""

import os
import json
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from .memory import Memory, MemoryType


class AIULUError(Exception):
    """StackMemory API error."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


@dataclass
class QueryResult:
    """Result from a query"""
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    latency_ms: int


@dataclass
class SearchResult:
    """Result from a search"""
    memories: List[Memory]
    total: int


class AIULU:
    """
    StackMemory Client - Shared memory for AI workflows
    
    Example:
        ulu = AIULU(api_key="your-key")
        
        # Ask a question
        result = ulu.ask("What's my favorite programming language?")
        print(result.answer)
        
        # Store a memory
        ulu.remember("I love Python", type=MemoryType.PREFERENCE)
        
        # Search memories
        results = ulu.search("programming")
        for mem in results.memories:
            print(mem.content)
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 30,
    ):
        """
        Initialize StackMemory client.
        
        Args:
            api_key: API key (or set STACKMEMORY_API_KEY or AI_ULU_API_KEY)
            base_url: API base URL (default: http://localhost:8080 for bridge)
            timeout: Request timeout in seconds
        """
        self.api_key = api_key or os.getenv("STACKMEMORY_API_KEY") or os.getenv("AI_ULU_API_KEY", "")
        self.base_url = (
            base_url
            or os.getenv("STACKMEMORY_BRIDGE_URL")
            or os.getenv("AI_ULU_BRIDGE_URL", "http://localhost:8080")
        )
        self.timeout = timeout
    
    def _request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Make API request"""
        url = f"{self.base_url}{endpoint}"
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "StackMemory-Python-SDK/1.0",
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        body = json.dumps(data).encode() if data else None
        
        try:
            req = Request(url, data=body, headers=headers, method=method)
            with urlopen(req, timeout=self.timeout) as response:
                return json.loads(response.read().decode())
        except HTTPError as e:
            raise AIULUError(f"HTTP {e.code}: {e.reason}", e.code)
        except URLError as e:
            raise AIULUError(f"Connection error: {e.reason}")
        except Exception as e:
            raise AIULUError(str(e))
    
    def ask(self, query: str, context: Optional[Dict] = None) -> QueryResult:
        """
        Ask a question through StackMemory.
        
        Args:
            query: Natural language question
            context: Optional context dictionary
            
        Returns:
            QueryResult with answer, sources, and confidence
        """
        result = self._request("/v1/query", "POST", {
            "query": query,
            "context": context,
            "source": "python-sdk",
        })
        
        if not result.get("success"):
            raise AIULUError(result.get("error", "Unknown error"))
        
        data = result.get("data", {})
        
        return QueryResult(
            answer=data.get("answer", ""),
            sources=data.get("sources", []),
            confidence=data.get("confidence", 0.0),
            latency_ms=result.get("latency_ms", 0),
        )
    
    def remember(
        self,
        content: str,
        type: MemoryType = MemoryType.FACT,
        metadata: Optional[Dict] = None,
    ) -> Memory:
        """
        Store a new memory.
        
        Args:
            content: Content to remember
            type: Memory type (identity, preference, fact)
            metadata: Optional metadata
            
        Returns:
            Created Memory object
        """
        result = self._request("/v1/memory", "POST", {
            "content": content,
            "type": type.value if isinstance(type, MemoryType) else type,
            "source": "python-sdk",
            "metadata": metadata,
        })
        
        if not result.get("success"):
            raise AIULUError(result.get("error", "Unknown error"))
        
        data = result.get("data", {})
        
        return Memory(
            id=data.get("id", ""),
            content=content,
            type=type,
            created_at=data.get("created_at"),
            metadata=metadata,
        )
    
    def search(
        self,
        query: str,
        limit: int = 10,
        type_filter: Optional[MemoryType] = None,
    ) -> SearchResult:
        """
        Search memories.
        
        Args:
            query: Search query
            limit: Maximum results
            type_filter: Filter by memory type
            
        Returns:
            SearchResult with memories list
        """
        data = {"query": query, "limit": limit}
        if type_filter:
            data["type_filter"] = type_filter.value if isinstance(type_filter, MemoryType) else type_filter
        
        result = self._request("/v1/search", "POST", data)
        
        if not result.get("success"):
            raise AIULUError(result.get("error", "Unknown error"))
        
        response_data = result.get("data", {})
        memories_data = response_data.get("memories", [])
        
        memories = [
            Memory(
                id=m.get("id", ""),
                content=m.get("content", ""),
                type=MemoryType(m.get("type", "fact")),
                created_at=m.get("created_at"),
                score=m.get("score"),
            )
            for m in memories_data
        ]
        
        return SearchResult(
            memories=memories,
            total=len(memories),
        )
    
    def orchestrate(self, query: str, context: Optional[Dict] = None) -> QueryResult:
        """
        Full MCP Hub orchestration query.
        
        Queries multiple sources (memory, web, GitHub, etc.)
        
        Args:
            query: Natural language query
            context: Optional context
            
        Returns:
            QueryResult with synthesized answer
        """
        result = self._request("/v1/orchestrate", "POST", {
            "query": query,
            "context": context,
            "source": "python-sdk",
        })
        
        if not result.get("success"):
            raise AIULUError(result.get("error", "Unknown error"))
        
        data = result.get("data", {})
        synth = data.get("synthesized", {})
        
        return QueryResult(
            answer=synth.get("answer", ""),
            sources=synth.get("sources", []),
            confidence=synth.get("confidence", 0.0),
            latency_ms=result.get("latency_ms", 0),
        )
    
    def health(self) -> bool:
        """Check if API is healthy"""
        try:
            result = self._request("/health", "GET")
            return result.get("status") == "healthy"
        except:
            return False
    
    # Aliases for convenience
    query = ask
    store = remember
    find = search
