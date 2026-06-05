import multiprocessing

bind = "0.0.0.0:8000"
workers = min(4, multiprocessing.cpu_count())
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
graceful_timeout = 30
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
