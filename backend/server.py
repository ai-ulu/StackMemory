from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

# Memory system imports
from lib.memory_orchestrator import MemoryOrchestrator


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Memory system initialization
memory_orchestrator = MemoryOrchestrator(
    vector_collection=db.memory_vectors,
    episodic_collection=db.memory_episodes,
    stm_max_items=20
)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Memory Models
class InteractionCreate(BaseModel):
    user_input: str
    system_output: str
    metadata: Optional[Dict[str, Any]] = None

class RecallQuery(BaseModel):
    query: str
    top_k: int = 5
    query_vector: Optional[List[float]] = None

class EpisodeCreate(BaseModel):
    text: str
    semantic: Optional[Dict[str, Any]] = None
    emotions: Optional[Dict[str, Any]] = None
    notes: Optional[Dict[str, Any]] = None

class HScoreWeightsUpdate(BaseModel):
    alpha: float = 0.4
    beta: float = 0.2
    gamma: float = 0.3
    delta: float = 0.1

class RecallQueryWithHScore(BaseModel):
    query: str
    top_k: int = 5
    query_vector: Optional[List[float]] = None
    use_h_score: bool = True

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Memory API Endpoints
@api_router.post("/memory/interaction")
async def record_interaction(interaction: InteractionCreate):
    """Etkileşim kaydet"""
    try:
        success = await memory_orchestrator.record_interaction(
            user_input=interaction.user_input,
            system_output=interaction.system_output,
            metadata=interaction.metadata
        )
        
        if success:
            return {"status": "success", "message": "Interaction recorded"}
        else:
            raise HTTPException(status_code=500, detail="Failed to record interaction")
            
    except Exception as e:
        logger.error(f"Error in record_interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/memory/recall")
async def recall_memories(query: RecallQuery):
    """Belleklerden geri çağır (eski endpoint - geriye dönük uyumluluk)"""
    try:
        result = await memory_orchestrator.recall_relevant(
            query=query.query,
            top_k=query.top_k,
            query_vector=query.query_vector,
            use_h_score=False  # Eski davranış
        )
        
        return {
            "status": "success",
            "query": query.query,
            "results": result
        }
        
    except Exception as e:
        logger.error(f"Error in recall_memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/memory/recall/h-score")
async def recall_memories_with_h_score(query: RecallQueryWithHScore):
    """Belleklerden H(x,ψ) puanlama ile geri çağır"""
    try:
        result = await memory_orchestrator.recall_relevant(
            query=query.query,
            top_k=query.top_k,
            query_vector=query.query_vector,
            use_h_score=query.use_h_score
        )
        
        return {
            "status": "success",
            "query": query.query,
            "h_score_enabled": query.use_h_score,
            "results": result
        }
        
    except Exception as e:
        logger.error(f"Error in recall_memories_with_h_score: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/memory/h-score/weights")
async def get_h_score_weights():
    """H(x,ψ) ağırlıklarını getir"""
    try:
        weights = memory_orchestrator.scorer.get_weights()
        return {
            "status": "success",
            "weights": weights.to_dict()
        }
        
    except Exception as e:
        logger.error(f"Error in get_h_score_weights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/memory/h-score/weights")
async def update_h_score_weights(weights: HScoreWeightsUpdate):
    """H(x,ψ) ağırlıklarını güncelle"""
    try:
        from lib.memory_scorer import HScoreWeights
        
        new_weights = HScoreWeights(
            alpha=weights.alpha,
            beta=weights.beta,
            gamma=weights.gamma,
            delta=weights.delta
        )
        
        memory_orchestrator.scorer.update_weights(new_weights)
        
        return {
            "status": "success",
            "message": "Weights updated",
            "weights": new_weights.to_dict()
        }
        
    except Exception as e:
        logger.error(f"Error in update_h_score_weights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/memory/stats")
async def get_memory_stats():
    """Bellek istatistikleri"""
    try:
        stats = await memory_orchestrator.get_stats()
        return {"status": "success", "stats": stats}
        
    except Exception as e:
        logger.error(f"Error in get_memory_stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/memory/recent")
async def get_recent_summary():
    """Son etkileşimlerin özeti"""
    try:
        summary = await memory_orchestrator.summarize_recent()
        return {"status": "success", "summary": summary}
        
    except Exception as e:
        logger.error(f"Error in get_recent_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/memory/episode")
async def add_episode(episode: EpisodeCreate):
    """Episode ekle"""
    try:
        result = await memory_orchestrator.episodic.add_episode(
            text=episode.text,
            semantic=episode.semantic,
            emotions=episode.emotions,
            notes=episode.notes
        )
        
        return {"status": "success", "episode": result}
        
    except Exception as e:
        logger.error(f"Error in add_episode: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/memory/episodes")
async def get_recent_episodes(limit: int = 10):
    """Son episode'ları getir"""
    try:
        episodes = await memory_orchestrator.episodic.get_recent(n=limit)
        return {"status": "success", "episodes": episodes, "count": len(episodes)}
        
    except Exception as e:
        logger.error(f"Error in get_recent_episodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize memory system on startup"""
    try:
        await memory_orchestrator.initialize()
        logger.info("Memory system initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize memory system: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()