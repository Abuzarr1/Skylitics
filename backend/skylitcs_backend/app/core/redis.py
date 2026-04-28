import redis.asyncio as redis
from app.core.config import settings

# Global redis connection pool
pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True
)

async def get_redis():
    """ Dependency for accessing Redis client """
    client = redis.Redis(connection_pool=pool)
    try:
        yield client
    finally:
        await client.aclose()
