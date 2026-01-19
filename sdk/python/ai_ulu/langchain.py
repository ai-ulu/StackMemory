"""
AI-ULU LangChain Integration

Provides LangChain-compatible memory and retriever classes.

Usage:
    from ai_ulu.langchain import AIULUMemory, AIULURetriever
    from langchain.chains import ConversationChain
    from langchain.chat_models import ChatOpenAI
    
    # As conversation memory
    memory = AIULUMemory()
    chain = ConversationChain(llm=ChatOpenAI(), memory=memory)
    
    # As retriever
    retriever = AIULURetriever()
    docs = retriever.get_relevant_documents("my preferences")
"""

from typing import List, Dict, Any, Optional
from .client import AIULU
from .memory import Memory, MemoryType

# Check if langchain is installed
try:
    from langchain.schema import BaseMemory, Document
    from langchain.schema.retriever import BaseRetriever
    from langchain.callbacks.manager import CallbackManagerForRetrieverRun
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    BaseMemory = object
    BaseRetriever = object
    Document = dict


class AIULUMemory(BaseMemory):
    """
    LangChain Memory backed by AI-ULU.
    
    Automatically stores conversation history and retrieves relevant memories.
    
    Example:
        from langchain.chains import ConversationChain
        from langchain.chat_models import ChatOpenAI
        
        memory = AIULUMemory()
        chain = ConversationChain(llm=ChatOpenAI(), memory=memory)
        
        response = chain.predict(input="I love pizza")
        # AI-ULU automatically stores this as a preference
    """
    
    client: AIULU = None
    memory_key: str = "history"
    human_prefix: str = "Human"
    ai_prefix: str = "AI"
    return_messages: bool = False
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        memory_key: str = "history",
        **kwargs,
    ):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("LangChain is required. Install with: pip install langchain")
        
        super().__init__(**kwargs)
        self.client = AIULU(api_key=api_key, base_url=base_url)
        self.memory_key = memory_key
    
    @property
    def memory_variables(self) -> List[str]:
        """Return memory variables"""
        return [self.memory_key]
    
    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Load relevant memories for the current input"""
        # Get the user's input
        user_input = inputs.get("input", inputs.get("human_input", ""))
        
        if not user_input:
            return {self.memory_key: ""}
        
        try:
            # Query AI-ULU for relevant memories
            result = self.client.ask(user_input)
            
            # Format as context
            if result.answer:
                context = f"[Relevant memories: {result.answer}]"
                return {self.memory_key: context}
        except:
            pass
        
        return {self.memory_key: ""}
    
    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, str]) -> None:
        """Save conversation context to AI-ULU"""
        user_input = inputs.get("input", inputs.get("human_input", ""))
        ai_output = outputs.get("output", outputs.get("response", ""))
        
        if user_input:
            # Analyze and potentially store as memory
            # Simple heuristics for memory classification
            lower_input = user_input.lower()
            
            mem_type = MemoryType.FACT
            should_store = False
            
            # Identity patterns
            if any(p in lower_input for p in ["my name is", "i am a", "i work", "i live"]):
                mem_type = MemoryType.IDENTITY
                should_store = True
            
            # Preference patterns
            elif any(p in lower_input for p in ["i like", "i love", "i prefer", "i hate", "my favorite"]):
                mem_type = MemoryType.PREFERENCE
                should_store = True
            
            # Explicit remember requests
            elif any(p in lower_input for p in ["remember that", "don't forget", "note that"]):
                mem_type = MemoryType.FACT
                should_store = True
            
            if should_store:
                try:
                    self.client.remember(user_input, type=mem_type)
                except:
                    pass  # Gracefully handle errors
    
    def clear(self) -> None:
        """Clear is not supported - memories are persistent"""
        pass


class AIULURetriever(BaseRetriever):
    """
    LangChain Retriever backed by AI-ULU.
    
    Retrieves relevant memories as LangChain Documents.
    
    Example:
        from langchain.chains import RetrievalQA
        from langchain.chat_models import ChatOpenAI
        
        retriever = AIULURetriever()
        qa = RetrievalQA.from_chain_type(
            llm=ChatOpenAI(),
            retriever=retriever,
        )
        
        response = qa.run("What are my preferences?")
    """
    
    client: AIULU = None
    search_limit: int = 5
    type_filter: Optional[MemoryType] = None
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        search_limit: int = 5,
        type_filter: Optional[MemoryType] = None,
        **kwargs,
    ):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("LangChain is required. Install with: pip install langchain")
        
        super().__init__(**kwargs)
        self.client = AIULU(api_key=api_key, base_url=base_url)
        self.search_limit = search_limit
        self.type_filter = type_filter
    
    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: Optional[Any] = None,
    ) -> List[Document]:
        """Get relevant documents from AI-ULU memory"""
        try:
            results = self.client.search(
                query=query,
                limit=self.search_limit,
                type_filter=self.type_filter,
            )
            
            documents = []
            for mem in results.memories:
                doc = Document(
                    page_content=mem.content,
                    metadata={
                        "id": mem.id,
                        "type": mem.type.value,
                        "score": mem.score,
                        "created_at": mem.created_at,
                        "source": "ai-ulu",
                    },
                )
                documents.append(doc)
            
            return documents
        except Exception as e:
            # Return empty list on error
            return []
    
    async def _aget_relevant_documents(
        self,
        query: str,
        *,
        run_manager: Optional[Any] = None,
    ) -> List[Document]:
        """Async version - delegates to sync for now"""
        return self._get_relevant_documents(query, run_manager=run_manager)


# Tool for LangChain agents
def create_ai_ulu_tools(api_key: Optional[str] = None, base_url: Optional[str] = None):
    """
    Create LangChain tools for AI-ULU.
    
    Returns tools for:
    - Querying memories
    - Storing memories
    - Searching memories
    - MCP Hub orchestration
    
    Example:
        from langchain.agents import initialize_agent, AgentType
        from langchain.chat_models import ChatOpenAI
        
        tools = create_ai_ulu_tools()
        agent = initialize_agent(
            tools=tools,
            llm=ChatOpenAI(),
            agent=AgentType.OPENAI_FUNCTIONS,
        )
    """
    try:
        from langchain.tools import Tool
    except ImportError:
        raise ImportError("LangChain is required. Install with: pip install langchain")
    
    client = AIULU(api_key=api_key, base_url=base_url)
    
    def query_memory(query: str) -> str:
        """Query AI-ULU memory for information about the user"""
        try:
            result = client.ask(query)
            return result.answer or "No relevant memories found."
        except Exception as e:
            return f"Error querying memory: {e}"
    
    def store_memory(input_str: str) -> str:
        """Store information to memory. Format: 'content|type' where type is identity/preference/fact"""
        try:
            parts = input_str.split("|")
            content = parts[0].strip()
            mem_type = MemoryType(parts[1].strip()) if len(parts) > 1 else MemoryType.FACT
            
            client.remember(content, type=mem_type)
            return f"Stored: {content[:50]}..."
        except Exception as e:
            return f"Error storing memory: {e}"
    
    def search_memory(query: str) -> str:
        """Search through stored memories"""
        try:
            results = client.search(query, limit=5)
            if not results.memories:
                return "No memories found."
            
            return "\n".join([f"- {m.content}" for m in results.memories])
        except Exception as e:
            return f"Error searching: {e}"
    
    def orchestrate_query(query: str) -> str:
        """Query MCP Hub for comprehensive answers from multiple sources"""
        try:
            result = client.orchestrate(query)
            return result.answer or "No answer found."
        except Exception as e:
            return f"Error: {e}"
    
    return [
        Tool(
            name="query_memory",
            func=query_memory,
            description="Query user's memory for personal information, preferences, or past context. Input: natural language question.",
        ),
        Tool(
            name="store_memory",
            func=store_memory,
            description="Store information to user's memory. Input format: 'content|type' where type is identity, preference, or fact.",
        ),
        Tool(
            name="search_memory",
            func=search_memory,
            description="Search through stored memories with keywords. Input: search keywords.",
        ),
        Tool(
            name="orchestrate_query",
            func=orchestrate_query,
            description="Query multiple sources (memory, web, GitHub) for comprehensive answers. Input: natural language question.",
        ),
    ]
