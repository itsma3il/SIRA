"""API routes for conversation management."""
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_session as get_db_session
from app.core.security import get_current_user, get_current_user_flexible
from app.models.user import User
from app.schemas.conversation import (
    SessionCreate, SessionUpdate, MessageCreate,
    SessionResponse, SessionListResponse, SessionDetailResponse,
    MessagePairResponse, RecommendationGenerationResponse
)
from app.services.conversation_service import get_conversation_service
from app.services.conversational_ai_service import get_conversational_ai_service
from app.repositories import conversation_repository

router = APIRouter(prefix="/api/conversations", tags=["conversations"])
logger = logging.getLogger(__name__)


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    session_create: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Create new conversation session.
    
    - Auto-generates title from profile name and date
    - Validates profile belongs to user
    """
    try:
        service = get_conversation_service()
        return service.create_session(db, current_user.id, session_create)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    profile_id: Optional[UUID] = Query(None, description="Filter by profile"),
    status: Optional[str] = Query(None, description="Filter by status (active/archived)"),
    limit: int = Query(50, ge=1, le=100, description="Max sessions to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    List user's conversation sessions with time-period grouping.
    
    - Groups by: Today, Yesterday, Last 7 days, Last month
    - Includes last message preview
    - Supports filtering by profile and status
    """
    try:
        service = get_conversation_service()
        result = service.get_user_sessions(
            db=db,
            user_id=current_user.id,
            profile_id=profile_id,
            status=status,
            limit=limit
        )
        logger.info(f"Listing sessions: total={result.total}, groups={len(result.sessions)}")
        return result
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list sessions")


@router.get("/sessions/archived/list", response_model=SessionListResponse)
async def list_archived_sessions(
    profile_id: Optional[UUID] = Query(None, description="Filter by profile"),
    limit: int = Query(50, ge=1, le=100, description="Max sessions to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    List user's archived conversation sessions with time-period grouping.
    
    - Shows only archived sessions
    - Groups by: Today, Yesterday, Last 7 days, Last month
    - Includes last message preview
    """
    try:
        service = get_conversation_service()
        result = service.get_user_sessions(
            db=db,
            user_id=current_user.id,
            profile_id=profile_id,
            status="archived",  # Force archived status
            limit=limit
        )
        logger.info(f"Listing archived sessions: total={result.total}, groups={len(result.sessions)}")
        return result
    except Exception as e:
        logger.error(f"Error listing archived sessions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list archived sessions")


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Get full session details with messages.
    
    - Includes all messages in chronological order
    - Includes profile and recommendation data
    """
    try:
        service = get_conversation_service()
        return service.get_session_detail(db, current_user.id, session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get session")


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: UUID,
    updates: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Update session title or status.
    
    - Can update title (custom session name)
    - Can update status (active/archived)
    """
    try:
        service = get_conversation_service()
        return service.update_session(db, current_user.id, session_id, updates)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update session")


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Delete session (cascades to messages and recommendation).
    
    - Permanently deletes session and all associated data
    - Cannot be undone
    """
    try:
        service = get_conversation_service()
        service.delete_session(db, current_user.id, session_id)
        return None
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete session")


@router.post("/sessions/{session_id}/messages", response_model=MessagePairResponse)
async def send_message(
    session_id: UUID,
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Send message and get AI response.
    
    - Adds user message to session
    - Generates context-aware AI response
    - Returns both messages
    """
    try:
        service = get_conversation_service()
        return await service.send_message(db, current_user.id, session_id, message)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.post("/sessions/{session_id}/stream")
async def stream_message(
    session_id: UUID,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user_flexible),
    db: Session = Depends(get_db_session)
):
    """
    Stream AI response to user message (SSE).
    
    - Saves user message first
    - Streams AI response in real-time
    - Saves complete AI response when done
    - Uses flexible auth to support EventSource (token via query param)
    """
    try:
        # Verify session ownership
        session = conversation_repository.get_by_id(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Extract message content
        message = message_data.content
        
        # Add user message
        conversation_repository.add_message(
            db=db,
            session_id=session_id,
            role="user",
            content=message
        )
        
        # Get context (optimize message history)
        profile = session.profile
        # Get first recommendation if exists (relationships is plural)
        recommendation = session.recommendations[0] if session.recommendations else None
        message_history = conversation_repository.get_recent_messages(db, session_id, limit=4)  # Reduced to 4 for faster response
        
        # Stream AI response
        ai_service = get_conversational_ai_service()
        
        async def event_generator():
            """Generate SSE events with improved error handling."""
            full_response = ""
            chunk_count = 0
            
            try:
                # Send immediate connection confirmation
                yield f"data: \n\n"
                
                async for chunk in ai_service.stream_response(
                    user_message=message,
                    profile=profile,
                    recommendation=recommendation,
                    message_history=message_history
                ):
                    chunk_count += 1
                    full_response += chunk
                    yield f"data: {chunk}\n\n"
                
                logger.info(f"Streamed {chunk_count} chunks, total length: {len(full_response)}")
                
                # Save complete response
                if full_response.strip():
                    conversation_repository.add_message(
                        db=db,
                        session_id=session_id,
                        role="assistant",
                        content=full_response
                    )
                
                yield "data: [DONE]\n\n"
            
            except Exception as e:
                logger.error(f"Error streaming: {str(e)}", exc_info=True)
                error_msg = "An error occurred"
                if "rate" in str(e).lower():
                    error_msg = "Rate limit exceeded. Please wait and try again."
                elif "timeout" in str(e).lower():
                    error_msg = "Request timed out. Please try again."
                yield f"data: [ERROR] {error_msg}\n\n"
        
        return StreamingResponse(   
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in stream setup: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to setup stream")


@router.post("/sessions/{session_id}/recommend", response_model=RecommendationGenerationResponse)
async def generate_recommendation(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Generate initial AI recommendation for session.
    
    - Creates recommendation using RAG pipeline
    - Links recommendation to session
    - Adds welcome message with summary
    - Can only be called once per session
    """
    try:
        service = get_conversation_service()
        return await service.generate_initial_recommendation(db, current_user.id, session_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendation")


@router.post("/sessions/{session_id}/recommend/stream")
async def stream_recommendation(
    session_id: UUID,
    current_user: User = Depends(get_current_user_flexible),
    db: Session = Depends(get_db_session)
):
    """
    Stream initial recommendation generation (SSE).
    
    - Generates recommendation using RAG + Mistral AI
    - Streams response in real-time
    - Links recommendation to session when complete
    - Uses flexible auth to support EventSource (token via query param)
    """
    
    async def event_generator():
        """Generate SSE events for recommendation."""
        try:
            # Verify session
            session = conversation_repository.get_by_id(db, session_id)
            if not session:
                yield "data: [ERROR] Session not found\n\n"
                return
            if session.user_id != current_user.id:
                yield "data: [ERROR] Not authorized to access this session\n\n"
                return
            if not session.profile_id:
                yield "data: [ERROR] Session must have a profile to generate recommendations. Please attach a profile first.\n\n"
                return
            
            # Get conversation context for subsequent recommendations
            recommendation_count = len(session.recommendations) if session.recommendations else 0
            conversation_context = None
            
            if recommendation_count > 0:
                # For subsequent recommendations, include recent conversation
                recent_messages = conversation_repository.get_recent_messages(db, session_id, limit=10)
                conversation_context = "\n".join([
                    f"{msg.role}: {msg.content[:200]}" for msg in recent_messages
                ])
                yield f"data: Generating recommendation #{recommendation_count + 1} based on our conversation...\n\n"
            else:
                yield "data: Generating your first personalized recommendation...\n\n"
            
            # Import recommendation service
            from app.services.recommendation_service import RecommendationService
            rec_service = RecommendationService()
            
            # Stream recommendation generation
            full_response = ""
            
            async for chunk in rec_service.stream_recommendation(
                profile_id=session.profile_id,
                session_id=session_id,
                conversation_context=conversation_context
            ):
                # stream_recommendation yields text chunks directly
                full_response += chunk
                yield f"data: {chunk}\n\n"
            
            # Signal completion
            yield "data: [DONE]\n\n"
            
            # Get the newly created recommendation (last one added)
            db.refresh(session)
            latest_recommendation = session.recommendations[-1] if session.recommendations else None
            
            # Add structured welcome message without verbose AI response
            rec_num = recommendation_count + 1
            
            # Extract structured data for concise summary
            structured = latest_recommendation.structured_data if latest_recommendation else {}
            program_count = len(structured.get("program_names", []))
            top_programs = structured.get("program_names", [])[:3]
            
            if rec_num == 1:
                welcome_msg = f"**Recommendation Generated**\n\nI've analyzed your profile and found **{program_count} graduate programs** that match your goals."
            else:
                welcome_msg = f"**Recommendation #{rec_num} Generated**\n\nBased on our conversation, I've found **{program_count} programs** tailored to your interests."
            
            # Add top programs if available
            if top_programs:
                welcome_msg += "\n\n**Top Matches:**\n"
                for i, prog in enumerate(top_programs, 1):
                    match_scores = structured.get("match_scores", [])
                    score = match_scores[i-1] if i-1 < len(match_scores) else "N/A"
                    welcome_msg += f"{i}. {prog} ({score}% match)\n"
                
                welcome_msg += "\nView the full details in the recommendation card above."
            
            conversation_repository.add_message(
                db=db,
                session_id=session_id,
                role="assistant",
                content=welcome_msg,
                message_metadata={
                    "type": "recommendation_generated",
                    "recommendation_id": str(latest_recommendation.id) if latest_recommendation else None,
                    "recommendation_number": rec_num
                }
            )
            
        except Exception as e:
            logger.error(f"Error streaming recommendation: {str(e)}", exc_info=True)
            yield f"data: [ERROR] {str(e)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
