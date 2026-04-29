import sys
import os

# Add the backend path to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend/skylitcs_backend"))

from app.core.config import Settings

def test_uri_transformation():
    # Test cases: (input_url, expected_prefix)
    test_cases = [
        ("postgres://user:pass@host/db", "postgresql+asyncpg://"),
        ("postgresql://user:pass@host/db", "postgresql+asyncpg://"),
        ("postgresql+asyncpg://user:pass@host/db", "postgresql+asyncpg://"),
        ("  postgres://user:pass@host/db  ", "postgresql+asyncpg://"),
        (None, "postgresql+asyncpg://"),
    ]
    
    for input_url, expected_prefix in test_cases:
        s = Settings(DATABASE_URL=input_url) if input_url is not None else Settings()
        actual = s.SQLALCHEMY_DATABASE_URI
        print(f"Input: {input_url!r}")
        print(f"Actual: {actual!r}")
        assert actual.startswith(expected_prefix), f"Failed for {input_url!r}: expected prefix {expected_prefix!r}, got {actual!r}"
        print("PASS")
        print("-" * 20)

if __name__ == "__main__":
    try:
        test_uri_transformation()
        print("\nAll tests passed successfully!")
    except Exception as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
