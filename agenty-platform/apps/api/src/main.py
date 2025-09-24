"""
Agenty Platform API - Main FastAPI application
Production-ready API server for the Agenty white-label voice AI agent platform.
"""

import os
import uvicorn
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

from api.v1.agents import router as agents_router
from api.v1.providers import router as providers_router
from utils.dependencies import get_app_config
from core.database import init_database

# Initialize FastAPI app
app = FastAPI(
    title="Agenty Platform API",
    description="White-label voice AI agent creation and management platform",
    version="1.0.0",
    docs_url=None,  # Disable default docs for custom implementation
    redoc_url=None,
    openapi_url="/api/v1/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js frontend
        "http://localhost:3001",  # Alternative frontend port
        "https://agenty-platform.vercel.app",  # Production frontend
        "https://app.agenty.com",  # Custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all API requests"""
    start_time = datetime.now()

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = (datetime.now() - start_time).total_seconds()

    # Log request details
    print(f"{request.method} {request.url.path} - {response.status_code} - {duration:.3f}s")

    return response

# Database initialization
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_database()
    print("✓ Database initialized successfully")

# Include API routers
app.include_router(agents_router, prefix="/api/v1")
app.include_router(providers_router, prefix="/api/v1")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "environment": "development"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    config = get_app_config()
    return {
        "name": config["app_name"],
        "version": config["version"],
        "environment": config["environment"],
        "docs_url": "/docs",
        "api_version": "v1",
        "endpoints": {
            "agents": "/api/v1/agents",
            "providers": "/api/v1/providers",
            "health": "/health"
        }
    }

# API documentation
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI with Agenty branding"""
    return get_swagger_ui_html(
        openapi_url="/api/v1/openapi.json",
        title="Agenty Platform API",
        oauth2_redirect_url="/docs/oauth2-redirect",
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css",
    )

# Custom OpenAPI schema
def custom_openapi():
    """Custom OpenAPI schema with additional metadata"""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Agenty Platform API",
        version="1.0.0",
        description="""
        # Agenty Platform API

        White-label voice AI agent creation and management platform.

        ## Features

        - **Agent Management**: Create, configure, and deploy voice AI agents
        - **Provider Marketplace**: Access 40+ AI providers (STT, LLM, TTS)
        - **Credential Management**: Secure API key storage and validation
        - **Real-time Control**: Start, stop, and monitor agent instances
        - **Configuration Testing**: Test agent setups before deployment

        ## Authentication

        All endpoints require Bearer token authentication:
        ```
        Authorization: Bearer <your-jwt-token>
        ```

        ## Rate Limits

        - **Free Tier**: 100 requests/hour
        - **Starter**: 1,000 requests/hour
        - **Pro**: 10,000 requests/hour
        - **Enterprise**: Unlimited

        ## Support

        For API support, contact: support@agenty.com
        """,
        routes=app.routes,
    )

    # Add custom metadata
    openapi_schema["info"]["x-logo"] = {
        "url": "https://agenty.com/logo.png"
    }

    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://api.agenty.com",
            "description": "Production server"
        }
    ]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url.path),
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    """Custom 500 handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "timestamp": datetime.now().isoformat()
        }
    )

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Agenty Platform API starting up...")
    print("📊 Initializing services...")

    # Initialize services (in production, add database connections, etc.)
    from utils.dependencies import get_provider_service, get_agent_factory

    provider_service = get_provider_service()
    agent_factory = get_agent_factory()

    print("✅ Provider service initialized")
    print("✅ Agent factory initialized")
    print("🎉 Agenty Platform API ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 Agenty Platform API shutting down...")

    # Cleanup active agents
    from utils.dependencies import get_agent_factory

    try:
        agent_factory = get_agent_factory()
        active_agents = agent_factory.get_active_agents()

        print(f"🧹 Cleaning up {len(active_agents)} active agents...")

        for agent in active_agents:
            await agent_factory.stop_agent(agent["id"])

        print("✅ Cleanup completed")
    except Exception as e:
        print(f"⚠️ Error during cleanup: {e}")

    print("👋 Agenty Platform API shutdown complete")

# Additional API endpoints
@app.get("/api/v1/status")
async def api_status():
    """Get API status and statistics"""
    from utils.dependencies import get_agent_factory

    agent_factory = get_agent_factory()
    active_agents = agent_factory.get_active_agents()

    return {
        "api_status": "running",
        "version": "1.0.0",
        "uptime": "N/A",  # TODO: Calculate actual uptime
        "active_agents": len(active_agents),
        "total_requests": "N/A",  # TODO: Implement request counter
        "memory_usage": "N/A",  # TODO: Get actual memory usage
        "timestamp": datetime.now().isoformat()
    }

# Agent WebSocket endpoint for real-time communication
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/api/v1/agents/{agent_id}/ws")
async def agent_websocket(websocket: WebSocket, agent_id: str):
    """WebSocket endpoint for real-time agent communication"""
    await websocket.accept()

    try:
        # Get agent factory
        from utils.dependencies import get_agent_factory
        agent_factory = get_agent_factory()

        # Check if agent exists
        agent_status = await agent_factory.get_agent_status(agent_id)
        if not agent_status:
            await websocket.send_json({"error": "Agent not found"})
            await websocket.close()
            return

        # Handle WebSocket communication
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_json()

                # Process message (mock for now)
                response = {
                    "type": "response",
                    "agent_id": agent_id,
                    "message": f"Echo: {data.get('message', '')}",
                    "timestamp": datetime.now().isoformat()
                }

                # Send response
                await websocket.send_json(response)

            except WebSocketDisconnect:
                print(f"WebSocket disconnected for agent {agent_id}")
                break
            except Exception as e:
                print(f"WebSocket error: {e}")
                await websocket.send_json({"error": str(e)})

    except Exception as e:
        print(f"WebSocket connection error: {e}")
        await websocket.close()

if __name__ == "__main__":
    # Run the API server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )