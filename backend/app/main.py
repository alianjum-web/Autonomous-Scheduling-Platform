from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.exception_handlers import register_exception_handlers
from app.api.health import router as health_router
from app.api.metrics import router as metrics_router
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logger import get_logger, setup_logging
from app.core.resend_config import get_resend_config
from app.core.sentry import init_sentry
from app.core.tracing import RequestTracingMiddleware
from app.services.agent import warm_triage_graph
from app.services.supabase_client import warm_supabase_pool

_logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


@asynccontextmanager
async def lifespan(_app: FastAPI):
    setup_logging()
    settings = get_settings()
    init_sentry(settings.sentry_dsn, settings.environment)
    await warm_supabase_pool()
    await warm_triage_graph()
    resend = get_resend_config()
    if resend.configured:
        _logger.info(
            "Resend configured",
            extra={"extra_data": {"from_email": resend.from_email, "smtp_host": resend.smtp_host}},
        )
    else:
        _logger.warning(
            "Resend not configured — set RESEND_API_KEY and RESEND_FROM_EMAIL; "
            "paste SMTP into Supabase → Authentication → Emails"
        )
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.state.limiter = limiter
    register_exception_handlers(app)
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(RequestTracingMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],  # normalized — must match browser Origin exactly
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    app.include_router(health_router)
    app.include_router(metrics_router)
    app.include_router(api_router, prefix="/v1")
    return app


app = create_app()
