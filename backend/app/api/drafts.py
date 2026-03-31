import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.models.content_draft import ContentDraft
from app.services.auth import get_current_user

router = APIRouter()

VALID_TOOL_TYPES = {
    "listing_copywriter",
    "aplus_content",
    "brand_story",
    "storefront_designer",
    "campaign",
}


class SaveDraftRequest(BaseModel):
    tool_type: str
    name: str
    data: dict
    draft_id: Optional[int] = None  # if provided, update existing


class DraftResponse(BaseModel):
    id: int
    tool_type: str
    name: str
    data: dict
    created_at: str
    updated_at: str


@router.post("/", response_model=DraftResponse)
async def save_draft(
    req: SaveDraftRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.tool_type not in VALID_TOOL_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid tool_type. Must be one of: {', '.join(VALID_TOOL_TYPES)}")
    if not req.name.strip():
        raise HTTPException(status_code=422, detail="Draft name cannot be empty")

    if req.draft_id:
        result = await db.execute(
            select(ContentDraft).where(
                ContentDraft.id == req.draft_id,
                ContentDraft.user_id == current_user.id,
            )
        )
        draft = result.scalar_one_or_none()
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")
        draft.name = req.name.strip()
        draft.data = json.dumps(req.data)
    else:
        draft = ContentDraft(
            user_id=current_user.id,
            tool_type=req.tool_type,
            name=req.name.strip(),
            data=json.dumps(req.data),
        )
        db.add(draft)

    await db.commit()
    await db.refresh(draft)
    return _to_response(draft)


@router.get("/", response_model=list[DraftResponse])
async def list_drafts(
    tool_type: Optional[str] = None,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = [ContentDraft.user_id == current_user.id]
    if tool_type:
        filters.append(ContentDraft.tool_type == tool_type)

    result = await db.execute(
        select(ContentDraft)
        .where(*filters)
        .order_by(ContentDraft.updated_at.desc())
        .limit(50)
    )
    drafts = result.scalars().all()
    return [_to_response(d) for d in drafts]


@router.delete("/{draft_id}")
async def delete_draft(
    draft_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ContentDraft).where(
            ContentDraft.id == draft_id,
            ContentDraft.user_id == current_user.id,
        )
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    await db.delete(draft)
    await db.commit()
    return {"success": True}


def _to_response(draft: ContentDraft) -> DraftResponse:
    return DraftResponse(
        id=draft.id,
        tool_type=draft.tool_type,
        name=draft.name,
        data=draft.data_dict(),
        created_at=str(draft.created_at),
        updated_at=str(draft.updated_at),
    )
