import os

# Render (and most PaaS) inject PORT; default 8000 for local Docker.
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
# workers = min(4, multiprocessing.cpu_count()) more workers is better for concurrency, but we only have 1 worker
workers = 1 # for now to avoid deployment issues with multiple workers high RAM
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
graceful_timeout = 30
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
