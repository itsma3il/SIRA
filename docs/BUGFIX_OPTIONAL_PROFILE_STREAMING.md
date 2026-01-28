# Bug Fix: NoneType Error in Streaming Without Profile

## Issue
Backend crashed with `'NoneType' object has no attribute 'profile_name'` when streaming chat messages in sessions without attached profiles.

**Error Location:** `POST /api/conversations/sessions/{session_id}/stream`

**Root Cause:** The `ConversationalAIService` required a `Profile` object but received `None` when sessions had no profile attached (which is valid according to the schema where `profile_id` is nullable).

## Solution
Made the `profile` parameter optional in the conversational AI service and added proper null-safety handling.

### Files Modified

#### 1. `/backend/app/services/conversational_ai_service.py`

**Changes:**
- Made `profile` parameter optional in `build_system_prompt()`, `generate_response()`, and `stream_response()`
- Added null-check before accessing profile attributes
- Added fallback message when no profile is attached

**Before:**
```python
def build_system_prompt(
    self,
    profile: Profile,  # Required - would crash if None
    recommendation: Optional[Recommendation] = None
) -> str:
    prompt += f"- Name: {profile.profile_name}\n"  # Crashes on None
```

**After:**
```python
def build_system_prompt(
    self,
    profile: Optional[Profile] = None,  # Now optional
    recommendation: Optional[Recommendation] = None
) -> str:
    if profile:
        prompt += f"- Name: {profile.profile_name}\n"  # Safe access
        # ... rest of profile context
    else:
        # No profile attached - provide general guidance
        prompt += "\n\n**Note:** This conversation has no attached profile. Provide general academic guidance.\n"
```

## Behavior After Fix

### Sessions WITH Profile
- AI receives full context including profile name, academic record, preferences
- Provides personalized advice based on student data
- **No change in behavior**

### Sessions WITHOUT Profile
- AI receives base system prompt without profile context
- Provides general academic guidance
- **No crash - gracefully handles missing profile**

## Testing Checklist

- [x] Backend compiles without errors
- [x] Backend service starts successfully
- [ ] Test streaming chat in session without profile (should work)
- [ ] Test streaming chat in session with profile (should work as before)
- [ ] Verify AI responses are appropriate for both scenarios

## Related Code

The route at `/api/conversations/sessions/{session_id}/stream` already correctly handles optional profiles:

```python
# Line 206 in conversations.py
profile = session.profile  # Can be None - now handled correctly
```

The recommendation streaming endpoint already validates profile existence:

```python
# Line 314 in conversations.py
if not session.profile_id:
    yield "data: [ERROR] Session must have a profile to generate recommendations..."
```

## Impact
- **User Experience:** Users can now chat in sessions without profiles for general questions
- **System Stability:** No more crashes when profile is missing
- **API Consistency:** Aligns with schema design where profile_id is nullable
- **Backward Compatibility:** Existing sessions with profiles work identically

## Date
January 2025
