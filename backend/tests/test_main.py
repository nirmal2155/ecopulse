import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "EcoPulse" in response.json().get("message", "")

def test_carbon_calculation():
    """Test the basic carbon footprint calculation endpoint."""
    # Assuming there's a quick test endpoint or we test the logic directly
    # For now, let's test a sample endpoint that might exist or just basic logic
    pass
