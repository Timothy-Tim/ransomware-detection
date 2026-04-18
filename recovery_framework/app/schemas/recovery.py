from pydantic import BaseModel

class RecoveryRequest(BaseModel):
    host: str