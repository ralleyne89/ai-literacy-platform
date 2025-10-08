import logging
import logging.config
import os
from typing import Optional

try:
    import structlog
except ImportError:  # pragma: no cover - fallback for restricted installs
    structlog = None


def configure_logging():
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()

    if structlog is None:
        logging.basicConfig(
            level=getattr(logging, log_level, logging.INFO),
            format='%(asctime)s %(levelname)s [%(name)s] %(message)s'
        )
        return

    logging.config.dictConfig({
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'structlog': {
                '()': structlog.stdlib.ProcessorFormatter,
                'processor': structlog.processors.JSONRenderer(),
                'foreign_pre_chain': [
                    structlog.processors.TimeStamper(fmt='iso'),
                    structlog.processors.add_log_level,
                ],
            }
        },
        'handlers': {
            'default': {
                'class': 'logging.StreamHandler',
                'formatter': 'structlog',
                'level': log_level,
            }
        },
        'root': {
            'handlers': ['default'],
            'level': log_level,
        },
    })

    structlog.configure(
        processors=[
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt='iso'),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: Optional[str] = None):
    if structlog is None:
        return logging.getLogger(name)
    return structlog.get_logger(name)
