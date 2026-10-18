def test_registration_and_login(client):
    registration = client.post("/api/auth/register", json={"name": "Alex Writer", "email": "alex@example.com", "password": "SecurePass123!"})
    assert registration.status_code == 201
    assert registration.json()["user"]["email"] == "alex@example.com"
    assert registration.json()["user"]["is_demo"] is False

    duplicate = client.post("/api/auth/register", json={"name": "Other", "email": "ALEX@example.com", "password": "SecurePass123!"})
    assert duplicate.status_code == 409

    login = client.post("/api/auth/login", json={"email": "alex@example.com", "password": "SecurePass123!"})
    assert login.status_code == 200
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {login.json()['access_token']}"})
    assert me.status_code == 200
    assert me.json()["name"] == "Alex Writer"


def test_login_rejects_bad_password(client):
    client.post("/api/auth/register", json={"name": "Alex Writer", "email": "alex@example.com", "password": "SecurePass123!"})
    response = client.post("/api/auth/login", json={"email": "alex@example.com", "password": "incorrect"})
    assert response.status_code == 401

