from pydantic import BaseModel
from typing import List, Optional

class QueryRequest(BaseModel):
    message: str
    context: Optional[dict] = None

class QueryResponse(BaseModel):
    response: str
    intent: Optional[str] = None
    confidence: float
