# Server-Sent Events (SSE) Authentication Security

## Problem
EventSource API (used for SSE) doesn't support custom HTTP headers, making it impossible to send Bearer tokens via the standard `Authorization` header.

## Solution
We've implemented a secure hybrid authentication approach for the streaming endpoint only:

### Backend Changes

1. **Flexible Token Extraction** (`backend/app/core/security.py`)
   - Added `_get_bearer_token_flexible()` - accepts token from header OR query parameter
   - Added `get_token_claims_flexible()` - validates tokens from either source
   - Added `get_current_user_flexible()` - user authentication for SSE endpoints

2. **SSE Endpoint Update** (`backend/app/api/routes/recommendations.py`)
   - `/stream/{profile_id}` now uses `get_current_user_flexible` dependency
   - Accepts token via `?token=xxx` query parameter
   - All other endpoints still require header-based authentication

### Frontend Changes

1. **API Client** (`frontend/lib/api/recommendations.ts`)
   - `getStreamingUrl()` encodes token in URL using `encodeURIComponent()`
   - Added security documentation comments
   - Other endpoints use standard Bearer token headers

2. **Hook Improvements** (`frontend/hooks/use-recommendation-stream.ts`)
   - Better error detection (checks EventSource.readyState)
   - Distinguishes between authentication and network errors
   - Cleaner error messages for users

## Security Considerations

### ✅ Mitigations in Place
1. **Short-lived Tokens**: Clerk JWT tokens expire automatically (typically 1 hour)
2. **HTTPS Only in Production**: Query parameters encrypted in transit
3. **URL Encoding**: Token properly encoded to prevent injection
4. **Token Validation**: Full JWT verification (signature, expiry, audience)
5. **User Verification**: Profile ownership checked after authentication

### ⚠️ Known Limitations
1. **Browser Logging**: URLs with tokens may be logged in browser history
2. **Server Logging**: Tokens may appear in server access logs
3. **Proxy Logging**: Intermediate proxies may log the URL

### 🔒 Best Practices
1. **Use HTTPS**: Always use HTTPS in production (never HTTP)
2. **Token Rotation**: Clerk automatically rotates tokens
3. **Limited Scope**: Only SSE endpoint accepts query param tokens
4. **Audit Logs**: Configure servers to sanitize URLs before logging
5. **Rate Limiting**: Consider adding rate limits to streaming endpoint

## Alternative Approaches Considered

### 1. WebSockets (Not Chosen)
- **Pros**: Supports authentication headers, bidirectional
- **Cons**: More complex, requires separate infrastructure, overkill for one-way streaming

### 2. Polling (Not Chosen)
- **Pros**: Simple, uses standard headers
- **Cons**: Inefficient, high latency, increased server load

### 3. Session-Based Auth (Not Chosen)
- **Pros**: No tokens in URLs
- **Cons**: Requires session storage, cookie management, complex with Clerk

### 4. Proxy Authentication (Not Chosen)
- **Pros**: Could convert header to query param
- **Cons**: Additional infrastructure, added complexity

## Testing

### Test Authentication
```bash
# Test header authentication (should work)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/recommendations/profile/UUID

# Test query param authentication for SSE (should work)
curl "http://localhost:8000/api/recommendations/stream/UUID?token=YOUR_TOKEN"

# Test SSE without token (should fail with 401)
curl http://localhost:8000/api/recommendations/stream/UUID
```

### Test Frontend
1. Open browser DevTools → Network tab
2. Generate recommendation
3. Look for `stream/{profileId}` request
4. Verify:
   - Status: 200 OK
   - Type: eventsource
   - Token present in query string
   - Content streaming in real-time

## Production Deployment

### Environment Variables
```bash
# Backend
CLERK_JWKS_URL=https://your-clerk-instance.clerk.accounts.dev/.well-known/jwks.json
CLERK_FRONTEND_API=your-clerk-frontend-api

# Frontend
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### Nginx Configuration (Example)
```nginx
# Sanitize query parameters in access logs
log_format main '$remote_addr - $remote_user [$time_local] "$request_uri" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for"';

# Or use a custom log format that strips tokens
map $request_uri $loggable_uri {
    ~^(?<path>.*)\?token=.* $path?token=***;
    default $request_uri;
}

access_log /var/log/nginx/access.log combined_sanitized;
```

### Security Headers
```nginx
# Always use HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Prevent token exposure in referrer
add_header Referrer-Policy "no-referrer" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://your-clerk-instance.clerk.accounts.dev" always;
```

## Monitoring

### Metrics to Track
1. Failed SSE authentication attempts (401s)
2. SSE connection duration
3. Token expiry errors
4. Concurrent SSE connections per user

### Alerts
- Spike in 401 errors on streaming endpoint
- Unusual number of concurrent connections
- Token validation failures

## Future Improvements

### Short-term
- [ ] Add rate limiting to SSE endpoint
- [ ] Implement token refresh mechanism
- [ ] Add connection timeout handling
- [ ] Log sanitization for query params

### Long-term
- [ ] Consider WebSocket upgrade path
- [ ] Implement request signing as additional layer
- [ ] Add connection pooling limits
- [ ] Consider alternative streaming protocols (gRPC streams)

## References

- [EventSource API MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Clerk JWT Tokens](https://clerk.com/docs/backend-requests/handling/manual-jwt)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
