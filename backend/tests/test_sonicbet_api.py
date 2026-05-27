"""SonicBet backend API tests.

Covers:
- Health/root endpoint
- Games listing (17 games incl new IDs)
- Auth (register / login / me) with cookie & bearer token
- Wallet (balance + deposit-pix)
- Game play (old + new game ids)
- Recent winners
- Promotions
"""
import os
import uuid
import random
import time
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # Fallback to frontend env file (test runner may not export it)
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break

API = f"{BASE_URL}/api"

EXPECTED_GAME_IDS = {
    # existing
    "fortune-tiger", "fortune-rabbit", "fortune-snake", "fortune-ox",
    "fortune-mouse", "mina-misteriosa",
    # newly added (11)
    "dragon-hatch", "wild-bandito", "mahjong-ways", "gates-olympus",
    "sweet-bonanza", "sugar-rush", "lucky-neko", "aztec-gold",
    "aviator", "crazy-time", "plinko",
}


# ---------- fixtures ----------

@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _gen_phone():
    # 11-digit BR mobile starting with 11 9 + 8 random digits
    return "119" + "".join(str(random.randint(0, 9)) for _ in range(8))


@pytest.fixture(scope="session")
def registered_user(session):
    phone = _gen_phone()
    password = "Test1234"
    payload = {"phone": phone, "password": password, "confirm_password": password}
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    user = r.json()
    assert "user_id" in user
    assert user["phone"] == phone
    # JWT cookie should be returned for the cookie-auth test
    token = None
    # Try to grab a bearer token by logging in (login also sets cookie + returns user)
    # Make a fresh session for bearer-token tests; the existing session keeps the cookie.
    return {"phone": phone, "password": password, "user": user}


@pytest.fixture(scope="session")
def bearer_token(registered_user):
    """Login on a fresh session to obtain a JWT token via Set-Cookie header."""
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={
        "phone": registered_user["phone"],
        "password": registered_user["password"],
    })
    assert r.status_code == 200, r.text
    token = s.cookies.get("access_token")
    assert token, "access_token cookie not set on login"
    return token


# ---------- health / root ----------

def test_root_endpoint(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "online"


# ---------- games listing ----------

def test_list_games_has_17_with_new_ids(session):
    r = session.get(f"{API}/games")
    assert r.status_code == 200
    games = r.json()
    assert isinstance(games, list)
    assert len(games) == 17, f"expected 17 games, got {len(games)}"
    ids = {g["id"] for g in games}
    missing = EXPECTED_GAME_IDS - ids
    assert not missing, f"missing game ids: {missing}"
    # Every game has required keys
    for g in games:
        assert {"id", "name", "provider", "rtp", "symbols"}.issubset(g.keys())
        assert isinstance(g["symbols"], list) and len(g["symbols"]) >= 4


# ---------- auth ----------

def test_register_returns_user_and_welcome_bonus(session, registered_user):
    # session has the cookie from registration -> /wallet/balance should reflect R$10
    r = session.get(f"{API}/wallet/balance")
    assert r.status_code == 200, r.text
    wallet = r.json()
    assert wallet["currency"] == "BRL"
    assert wallet["balance"] == 10.0, f"expected welcome bonus 10.0, got {wallet['balance']}"


def test_login_with_registered_credentials(registered_user):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={
        "phone": registered_user["phone"],
        "password": registered_user["password"],
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user_id"] == registered_user["user"]["user_id"]
    assert "password_hash" not in body
    assert s.cookies.get("access_token")


def test_login_with_wrong_password_returns_401(registered_user):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={
        "phone": registered_user["phone"],
        "password": "WrongPass!",
    })
    assert r.status_code == 401


def test_auth_me_via_cookie(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert "user_id" in r.json()


def test_auth_me_via_bearer_token(bearer_token):
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {bearer_token}"})
    assert r.status_code == 200, r.text
    assert "user_id" in r.json()


def test_protected_endpoint_without_auth_returns_401():
    r = requests.get(f"{API}/wallet/balance")
    assert r.status_code == 401


# ---------- wallet ----------

def test_deposit_pix_increases_balance(session):
    # Balance before
    r0 = session.get(f"{API}/wallet/balance")
    assert r0.status_code == 200
    before = r0.json()["balance"]

    r = session.post(f"{API}/wallet/deposit-pix", json={"amount": 20})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "completed"
    assert body["amount"] == 20
    assert body["new_balance"] == pytest.approx(before + 20)

    r2 = session.get(f"{API}/wallet/balance")
    assert r2.status_code == 200
    assert r2.json()["balance"] == pytest.approx(before + 20)


def test_deposit_pix_below_minimum_returns_400(session):
    r = session.post(f"{API}/wallet/deposit-pix", json={"amount": 5})
    assert r.status_code == 400


# ---------- gameplay (old + new ids) ----------

@pytest.mark.parametrize("game_id", [
    "fortune-tiger",     # existing
    "mina-misteriosa",   # existing
    "aviator",           # new
    "gates-olympus",     # new
    "plinko",            # new
    "crazy-time",        # new
])
def test_play_game_for_old_and_new_ids(session, game_id):
    r = session.post(f"{API}/games/{game_id}/play", json={"bet_amount": 5})
    assert r.status_code == 200, f"{game_id} -> {r.status_code} {r.text}"
    data = r.json()
    assert data["game_name"] == game_id
    assert data["bet_amount"] == 5
    assert data["result"] in ("win", "loss")
    assert "new_balance" in data
    assert isinstance(data["symbols"], list) and len(data["symbols"]) == 3


def test_play_unknown_game_returns_404(session):
    r = session.post(f"{API}/games/not-a-real-game/play", json={"bet_amount": 5})
    assert r.status_code == 404


# ---------- public endpoints ----------

def test_recent_winners_returns_list(session):
    r = session.get(f"{API}/games/recent-winners")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_promotions_returns_six(session):
    r = session.get(f"{API}/promotions")
    assert r.status_code == 200
    promos = r.json()
    assert isinstance(promos, list)
    assert len(promos) == 6
    for p in promos:
        assert {"id", "title", "description", "type", "value", "color"}.issubset(p.keys())
