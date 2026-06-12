from pydantic import BaseModel


class WorkspaceResponse(BaseModel):
    name: str
    slug: str
