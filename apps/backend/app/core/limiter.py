from slowapi import Limiter
from slowapi.util import get_remote_address

# We use get_remote_address to rate limit per IP address
limiter = Limiter(key_func=get_remote_address)
