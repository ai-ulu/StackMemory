#!/usr/bin/env python3
"""
StackMemory Universal Bridge Server

The backbone that connects StackMemory to external tools and workflows:
- REST API (ChatGPT, LangChain, any HTTP client)
- WebSocket (Slack, Discord, real-time apps)
- CLI (Terminal tools)
- MCP Protocol (Claude, Cursor, compatible coding clients)

This is the shared memory bridge for AI-native development workflows.
"""

import os
import re
import json
import asyncio
import logging
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from collections import defaultdict
import time

# FastAPI for REST + WebSocket
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Async HTTP client
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stackmemory-bridge")

# =============================================================================
# API Key Authentication & Rate Limiting
# =============================================================================

# Key scopes and their permissions
KEY_SCOPES = {
    'read': ['memory:read', 'search', 'query'],
    'write': ['memory:read', 'memory:write', 'search', 'query', 'orchestrate'],
    'full': ['memory:read', 'memory:write', 'memory:delete', 'search', 'query', 'orchestrate', 'export'],
    'admin': ['*'],  # All permissions
}

# Rate limits per scope (requests per minute)
RATE_LIMITS = {
    'read': {'rpm': 60, 'daily': 1000},
    'write': {'rpm': 30, 'daily': 500},
    'full': {'rpm': 100, 'daily': 5000},
    'admin': {'rpm': 200, 'daily': 10000},
}

# In-memory rate limit store (use Redis in production)
rate_limit_store: Dict[str, Dict[str, int]] = defaultdict(lambda: {'count': 0, 'window': 0})

def parse_api_key(key: str) -> Optional[Dict[str, Any]]:
    """Parse API key to extract scope and validate format"""
    if not key:
        return None
    
    # Format: ulu_[scope]_[token]
    match = re.match(r'^ulu_([a-z]+)_([A-Za-z0-9_-]+)$', key)
    if not match:
        # Also accept Bearer tokens
        if key.startswith('Bearer '):
            key = key[7:]
            match = re.match(r'^ulu_([a-z]+)_([A-Za-z0-9_-]+)$', key)
    
    if not match:
        return None
    
    scope, token = match.groups()
    if scope not in KEY_SCOPES:
        return None
    
    return {
        'scope': scope,
        'token': token,
        'permissions': KEY_SCOPES[scope],
        'key_hash': hashlib.sha256(key.encode()).hexdigest(),
    }

def has_permission(key_info: Dict, permission: str) -> bool:
    """Check if key has required permission"""
    if not key_info:
        return False
    
    permissions = key_info.get('permissions', [])
    
    # Admin has all permissions
    if '*' in permissions:
        return True
    
    return permission in permissions

def check_rate_limit(key_hash: str, scope: str) -> Dict[str, Any]:
    """Check and update rate limit for a key"""
    limits = RATE_LIMITS.get(scope, RATE_LIMITS['read'])
    now = int(time.time())
    window = now // 60  # 1 minute windows
    
    key = f"{key_hash}:{window}"
    
    if rate_limit_store[key]['window'] != window:
        rate_limit_store[key] = {'count': 0, 'window': window}
    
    current_count = rate_limit_store[key]['count']
    
    if current_count >= limits['rpm']:
        return {
            'allowed': False,
            'remaining': 0,
            'reset_at': (window + 1) * 60,
            'limit': limits['rpm'],
        }
    
    rate_limit_store[key]['count'] += 1
    
    return {
        'allowed': True,
        'remaining': limits['rpm'] - current_count - 1,
        'reset_at': (window + 1) * 60,
        'limit': limits['rpm'],
    }

async def validate_api_key(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency to validate API key from Authorization header.
    Returns key info if valid, None if no key provided.
    Raises HTTPException if key is invalid.
    """
    if not authorization:
        return None
    
    # Remove 'Bearer ' prefix if present
    key = authorization
    if key.startswith('Bearer '):
        key = key[7:]
    
    key_info = parse_api_key(key)
    
    if not key_info:
        raise HTTPException(status_code=401, detail="Invalid API key format")
    
    # Check rate limit
    rate_limit = check_rate_limit(key_info['key_hash'], key_info['scope'])
    
    if not rate_limit['allowed']:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Limit: {rate_limit['limit']}/min. Reset at: {rate_limit['reset_at']}",
            headers={
                'X-RateLimit-Limit': str(rate_limit['limit']),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': str(rate_limit['reset_at']),
            }
        )
    
    # Validate against AI-ULU backend (optional - for now trust the format)
    # In production, you'd verify the key hash against the database
    
    return key_info

def require_permission(permission: str):
    """Decorator factory to require specific permission"""
    async def permission_checker(key_info: Optional[Dict] = Depends(validate_api_key)):
        if not key_info:
            raise HTTPException(status_code=401, detail="API key required")
        
        if not has_permission(key_info, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied. Required: {permission}. Your scope: {key_info['scope']}"
            )
        
        return key_info
    
    return permission_checker

# =============================================================================
# Configuration
# =============================================================================

STACKMEMORY_API_URL = os.getenv(
    "STACKMEMORY_API_URL",
    os.getenv("AI_ULU_API_URL", "http://localhost:3000"),
)
AI_ULU_API_URL = STACKMEMORY_API_URL
BRIDGE_PORT = int(os.getenv("BRIDGE_PORT", "8080"))
BRIDGE_HOST = os.getenv("BRIDGE_HOST", "0.0.0.0")

# =============================================================================
# Models
# =============================================================================

class QueryRequest(BaseModel):
    """Universal query request"""
    query: str = Field(..., description="Natural language query")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    source: Optional[str] = Field(default="api", description="Source of the query (cli, slack, discord, etc)")
    user_id: Optional[str] = Field(default=None, description="User identifier")
    session_id: Optional[str] = Field(default=None, description="Session for conversation continuity")

class MemoryRequest(BaseModel):
    """Memory storage request"""
    content: str = Field(..., description="Content to remember")
    type: str = Field(default="fact", description="Memory type: identity, preference, fact")
    source: Optional[str] = Field(default="api", description="Where this memory came from")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")

class SearchRequest(BaseModel):
    """Memory search request"""
    query: str = Field(..., description="Search query")
    limit: int = Field(default=10, description="Maximum results")
    type_filter: Optional[str] = Field(default=None, description="Filter by memory type")

class BridgeResponse(BaseModel):
    """Standard bridge response"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    source: str = "ai-ulu-bridge"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    latency_ms: Optional[int] = None

# =============================================================================
# WebSocket Manager
# =============================================================================

class ConnectionManager:
    """Manage WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, List[str]] = {}  # channel -> [connection_ids]
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            # Remove from all subscriptions
            for channel in self.subscriptions:
                if client_id in self.subscriptions[channel]:
                    self.subscriptions[channel].remove(client_id)
            logger.info(f"Client {client_id} disconnected. Total: {len(self.active_connections)}")
    
    async def send_personal(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    async def broadcast(self, message: dict, channel: str = "global"):
        """Broadcast to all subscribers of a channel"""
        subscribers = self.subscriptions.get(channel, list(self.active_connections.keys()))
        for client_id in subscribers:
            if client_id in self.active_connections:
                try:
                    await self.active_connections[client_id].send_json(message)
                except:
                    pass
    
    def subscribe(self, client_id: str, channel: str):
        if channel not in self.subscriptions:
            self.subscriptions[channel] = []
        if client_id not in self.subscriptions[channel]:
            self.subscriptions[channel].append(client_id)

manager = ConnectionManager()

# =============================================================================
# FastAPI App
# =============================================================================

app = FastAPI(
    title="AI-ULU Universal Bridge",
    description="""
    # The Universal AI Backbone
    
    Connect AI-ULU to **everything**:
    - ChatGPT (Custom GPT Actions)
    - VS Code, Cursor, JetBrains
    - Slack, Discord, Telegram
    - LangChain, AutoGPT, CrewAI
    - Terminal (CLI)
    - Any HTTP/WebSocket client
    
    **One brain, everywhere.**
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - allow all origins for universal access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# HTTP Client
# =============================================================================

async def get_http_client():
    async with httpx.AsyncClient(timeout=30.0) as client:
        yield client

# =============================================================================
# REST Endpoints
# =============================================================================

@app.get("/")
async def root():
    """Bridge status"""
    return {
        "service": "AI-ULU Universal Bridge",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "query": "/v1/query",
            "memory": "/v1/memory",
            "search": "/v1/search",
            "orchestrate": "/v1/orchestrate",
            "websocket": "/ws/{client_id}",
        },
        "docs": "/docs",
    }

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# -----------------------------------------------------------------------------
# Query Endpoint - Universal natural language query
# -----------------------------------------------------------------------------

@app.post("/v1/query", response_model=BridgeResponse)
async def query(
    request: QueryRequest,
    key_info: Optional[Dict] = Depends(validate_api_key),
    authorization: Optional[str] = Header(None),
):
    """
    Universal query endpoint.
    
    Works with:
    - ChatGPT Custom Actions
    - LangChain agents
    - CLI tools
    - Any HTTP client
    
    Example:
    ```
    POST /v1/query
    {"query": "What do I prefer for breakfast?"}
    ```
    """
    start_time = datetime.utcnow()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Route to AI-ULU orchestrator
            response = await client.post(
                f"{AI_ULU_API_URL}/api/orchestrate",
                json={
                    "query": request.query,
                    "options": {
                        "source": request.source,
                        "context": request.context,
                    }
                },
                headers={"Authorization": authorization} if authorization else {},
            )
            
            data = response.json()
            latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return BridgeResponse(
                success=data.get("success", True),
                data={
                    "answer": data.get("synthesized", {}).get("answer", ""),
                    "sources": data.get("synthesized", {}).get("sources", []),
                    "confidence": data.get("synthesized", {}).get("confidence", 0),
                },
                latency_ms=latency,
            )
    except Exception as e:
        logger.error(f"Query error: {e}")
        return BridgeResponse(success=False, error=str(e))

# -----------------------------------------------------------------------------
# Memory Endpoints
# -----------------------------------------------------------------------------

@app.post("/v1/memory", response_model=BridgeResponse)
async def store_memory(
    request: MemoryRequest,
    key_info: Dict = Depends(require_permission('memory:write')),
    authorization: Optional[str] = Header(None),
):
    """
    Store a new memory.
    
    Example:
    ```
    POST /v1/memory
    {"content": "I prefer dark mode", "type": "preference"}
    ```
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{AI_ULU_API_URL}/api/memories",
                json={
                    "content": request.content,
                    "type": request.type,
                    "write_source": request.source,
                    "metadata": request.metadata,
                },
                headers={"Authorization": authorization} if authorization else {},
            )
            
            data = response.json()
            
            # Broadcast to WebSocket subscribers
            await manager.broadcast({
                "event": "memory_created",
                "data": {"content": request.content, "type": request.type},
            }, channel="memories")
            
            return BridgeResponse(success=True, data=data)
    except Exception as e:
        logger.error(f"Memory store error: {e}")
        return BridgeResponse(success=False, error=str(e))

@app.post("/v1/search", response_model=BridgeResponse)
async def search_memories(
    request: SearchRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Search memories.
    
    Example:
    ```
    POST /v1/search
    {"query": "breakfast preferences", "limit": 5}
    ```
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {"q": request.query, "limit": request.limit}
            if request.type_filter:
                params["type"] = request.type_filter
                
            response = await client.get(
                f"{AI_ULU_API_URL}/api/memories/search",
                params=params,
                headers={"Authorization": authorization} if authorization else {},
            )
            
            data = response.json()
            return BridgeResponse(success=True, data=data)
    except Exception as e:
        logger.error(f"Search error: {e}")
        return BridgeResponse(success=False, error=str(e))

# -----------------------------------------------------------------------------
# Orchestrate Endpoint - Full MCP Hub access
# -----------------------------------------------------------------------------

@app.post("/v1/orchestrate", response_model=BridgeResponse)
async def orchestrate(
    request: QueryRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Full MCP Hub orchestration.
    
    Queries multiple sources:
    - Local memory
    - Web search (Brave)
    - GitHub
    - Notion
    - And more...
    
    Example:
    ```
    POST /v1/orchestrate
    {"query": "Python best practices 2025", "context": {"project": "backend"}}
    ```
    """
    start_time = datetime.utcnow()
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AI_ULU_API_URL}/api/orchestrate",
                json={
                    "query": request.query,
                    "options": {
                        "source": request.source,
                        "context": request.context,
                        "includeMemory": True,
                        "synthesize": True,
                    }
                },
                headers={"Authorization": authorization} if authorization else {},
            )
            
            data = response.json()
            latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return BridgeResponse(
                success=data.get("success", True),
                data=data,
                latency_ms=latency,
            )
    except Exception as e:
        logger.error(f"Orchestrate error: {e}")
        return BridgeResponse(success=False, error=str(e))

# -----------------------------------------------------------------------------
# Conversation Endpoint - For chatbots
# -----------------------------------------------------------------------------

@app.post("/v1/chat", response_model=BridgeResponse)
async def chat(
    request: QueryRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Chat endpoint for conversational AI.
    
    Maintains context and uses memory.
    Perfect for Slack/Discord bots and ChatGPT Actions.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AI_ULU_API_URL}/api/chat",
                json={
                    "message": request.query,
                    "conversation_id": request.session_id,
                },
                headers={"Authorization": authorization} if authorization else {},
            )
            
            data = response.json()
            return BridgeResponse(success=True, data=data)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return BridgeResponse(success=False, error=str(e))

# =============================================================================
# WebSocket Endpoint - Real-time
# =============================================================================

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket for real-time updates.
    
    Events:
    - memory_created: New memory added
    - memory_updated: Memory modified
    - query_result: Query completed
    - system: System messages
    
    Commands:
    - {"action": "subscribe", "channel": "memories"}
    - {"action": "query", "query": "..."}
    - {"action": "store", "content": "...", "type": "fact"}
    """
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action", "")
            
            if action == "subscribe":
                channel = data.get("channel", "global")
                manager.subscribe(client_id, channel)
                await manager.send_personal(client_id, {
                    "event": "subscribed",
                    "channel": channel,
                })
            
            elif action == "query":
                query = data.get("query", "")
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{AI_ULU_API_URL}/api/orchestrate",
                        json={"query": query},
                    )
                    result = response.json()
                    await manager.send_personal(client_id, {
                        "event": "query_result",
                        "data": result,
                    })
            
            elif action == "store":
                content = data.get("content", "")
                mem_type = data.get("type", "fact")
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{AI_ULU_API_URL}/api/memories",
                        json={"content": content, "type": mem_type},
                    )
                    result = response.json()
                    await manager.send_personal(client_id, {
                        "event": "memory_stored",
                        "data": result,
                    })
                    # Broadcast to subscribers
                    await manager.broadcast({
                        "event": "memory_created",
                        "data": {"content": content, "type": mem_type},
                    }, channel="memories")
            
            elif action == "ping":
                await manager.send_personal(client_id, {"event": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# =============================================================================
# OpenAPI Spec for ChatGPT Custom Actions
# =============================================================================

@app.get("/openapi-gpt.json")
async def openapi_for_gpt():
    """
    OpenAPI spec optimized for ChatGPT Custom GPT Actions.
    
    Use this URL when creating a Custom GPT:
    https://your-bridge-url/openapi-gpt.json
    """
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "AI-ULU Memory API",
            "description": "Access your personal AI memory. Remember everything, forget nothing.",
            "version": "1.0.0",
        },
        "servers": [
            {"url": "https://bridge.ai-ulu.com", "description": "Production"},
        ],
        "paths": {
            "/v1/query": {
                "post": {
                    "operationId": "queryMemory",
                    "summary": "Ask about your memories",
                    "description": "Query your personal memory with natural language. The AI will search through your memories and provide relevant information.",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "query": {
                                            "type": "string",
                                            "description": "Your question about your memories",
                                        },
                                    },
                                    "required": ["query"],
                                },
                            },
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Successful response with answer from memory",
                        },
                    },
                },
            },
            "/v1/memory": {
                "post": {
                    "operationId": "storeMemory",
                    "summary": "Save something to memory",
                    "description": "Store new information in your memory. Use this when the user shares personal information, preferences, or facts they want remembered.",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "content": {
                                            "type": "string",
                                            "description": "The information to remember",
                                        },
                                        "type": {
                                            "type": "string",
                                            "enum": ["identity", "preference", "fact"],
                                            "description": "Type of memory: identity (who they are), preference (what they like), fact (general info)",
                                        },
                                    },
                                    "required": ["content"],
                                },
                            },
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Memory stored successfully",
                        },
                    },
                },
            },
            "/v1/search": {
                "post": {
                    "operationId": "searchMemories",
                    "summary": "Search through memories",
                    "description": "Search for specific memories using keywords or phrases.",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "query": {
                                            "type": "string",
                                            "description": "Search keywords",
                                        },
                                        "limit": {
                                            "type": "integer",
                                            "default": 10,
                                            "description": "Maximum results to return",
                                        },
                                    },
                                    "required": ["query"],
                                },
                            },
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "List of matching memories",
                        },
                    },
                },
            },
        },
    }

# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting AI-ULU Universal Bridge on {BRIDGE_HOST}:{BRIDGE_PORT}")
    logger.info(f"AI-ULU API URL: {AI_ULU_API_URL}")
    logger.info("Endpoints: REST API, WebSocket, OpenAPI for GPT")
    
    uvicorn.run(app, host=BRIDGE_HOST, port=BRIDGE_PORT)
