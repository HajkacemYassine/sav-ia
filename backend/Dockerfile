FROM python:3.11-slim

WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Installer pip et les dépendances
COPY pyproject.toml .
RUN pip install --upgrade pip && pip install -e .

# Copier le code
COPY . .

# Démarrer FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]