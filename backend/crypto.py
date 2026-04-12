import os
from cryptography.fernet import Fernet

# Validate ENCRYPTION_KEY at module load time (except in test mode)
_ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not _ENCRYPTION_KEY and os.getenv("AGENTMESH_ENV") != "test":
    raise RuntimeError(
        "ENCRYPTION_KEY environment variable is required. "
        "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
    )

_fernet = Fernet(_ENCRYPTION_KEY.encode()) if _ENCRYPTION_KEY else None


def _get_fernet() -> Fernet:
    if _fernet is None:
        # Only reached in test mode when ENCRYPTION_KEY is not set
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise RuntimeError(
                "ENCRYPTION_KEY environment variable is required. "
                "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        return Fernet(key.encode())
    return _fernet


def encrypt(value: str) -> str:
    return _get_fernet().encrypt(value.encode()).decode()


def decrypt(token: str) -> str:
    return _get_fernet().decrypt(token.encode()).decode()
