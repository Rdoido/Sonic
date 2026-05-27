"""
SonicBet Backend API Tests
Tests for: Auth, Wallet/PIX, Games, VIP/Profile, Redeem, Referral, Contact, Promotions
"""
import os
import random
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://tiger-rabbit-games.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def make_phone():
    """Unique 11-digit phone starting with 11"""
    return "11" + str(random.randint(100000000, 999999999))


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def primary_user():
    """Create a primary user with session for tests."""
    s = requests.Session()
    phone = make_phone()
    password = "senha123"
    r = s.post(f"{API}/auth/register", json={
        "phone": phone, "password": password, "confirm_password": password
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "session": s, "phone": phone, "password": password,
        "user_id": data["user_id"], "invite_code": data["invite_code"],
        "public_id": data["public_id"]
    }


# ---------- Health ----------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "online"


# ---------- AUTH ----------
class TestAuth:
    def test_register_success_and_cookie_and_welcome_bonus(self):
        s = requests.Session()
        phone = make_phone()
        r = s.post(f"{API}/auth/register", json={
            "phone": phone,
            "password": "senha123",
            "confirm_password": "senha123"
        })
        assert r.status_code == 200, r.text
        user = r.json()
        assert user["phone"] == phone  # normalized
        assert "password_hash" not in user
        assert "_id" not in user  # No MongoDB ObjectId leakage
        assert "invite_code" in user and len(user["invite_code"]) == 8
        # Cookie set
        assert "access_token" in s.cookies.get_dict()
        # Welcome bonus R$10 should appear in wallet
        rb = s.get(f"{API}/wallet/balance")
        assert rb.status_code == 200
        assert rb.json()["balance"] == 10.0

    def test_register_password_mismatch(self):
        r = requests.post(f"{API}/auth/register", json={
            "phone": make_phone(), "password": "senha123", "confirm_password": "outra123"
        })
        assert r.status_code == 400
        assert "não coincidem" in r.json()["detail"].lower() or "senha" in r.json()["detail"].lower()

    def test_register_password_too_short(self):
        r = requests.post(f"{API}/auth/register", json={
            "phone": make_phone(), "password": "12345", "confirm_password": "12345"
        })
        assert r.status_code == 400

    def test_register_invalid_phone(self):
        r = requests.post(f"{API}/auth/register", json={
            "phone": "123", "password": "senha123", "confirm_password": "senha123"
        })
        assert r.status_code == 400

    def test_register_duplicate_phone(self, primary_user):
        r = requests.post(f"{API}/auth/register", json={
            "phone": primary_user["phone"], "password": "senha123", "confirm_password": "senha123"
        })
        assert r.status_code == 400
        assert "cadastrado" in r.json()["detail"].lower()

    def test_login_success(self, primary_user):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={
            "phone": primary_user["phone"], "password": primary_user["password"]
        })
        assert r.status_code == 200
        assert r.json()["user_id"] == primary_user["user_id"]
        assert "access_token" in s.cookies.get_dict()

    def test_login_invalid_password(self, primary_user):
        r = requests.post(f"{API}/auth/login", json={
            "phone": primary_user["phone"], "password": "wrongpass"
        })
        assert r.status_code == 401

    def test_login_nonexistent_phone(self):
        r = requests.post(f"{API}/auth/login", json={
            "phone": "11000000000", "password": "senha123"
        })
        assert r.status_code == 401

    def test_me_with_cookie(self, primary_user):
        r = primary_user["session"].get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["user_id"] == primary_user["user_id"]

    def test_me_with_bearer_header(self, primary_user):
        # Login fresh to capture token from cookie, then use as Bearer
        s = requests.Session()
        s.post(f"{API}/auth/login", json={
            "phone": primary_user["phone"], "password": primary_user["password"]
        })
        token = s.cookies.get("access_token")
        assert token
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["user_id"] == primary_user["user_id"]

    def test_me_unauthenticated(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout_clears_cookie(self):
        s = requests.Session()
        phone = make_phone()
        s.post(f"{API}/auth/register", json={
            "phone": phone, "password": "senha123", "confirm_password": "senha123"
        })
        assert "access_token" in s.cookies.get_dict()
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        # After logout, /auth/me should be unauthorized
        r2 = s.get(f"{API}/auth/me")
        assert r2.status_code == 401


# ---------- WALLET ----------
class TestWallet:
    def test_balance_creates_wallet_with_bonus(self, primary_user):
        r = primary_user["session"].get(f"{API}/wallet/balance")
        assert r.status_code == 200
        assert r.json()["currency"] == "BRL"
        assert r.json()["balance"] >= 10.0

    def test_deposit_pix_success(self, primary_user):
        before = primary_user["session"].get(f"{API}/wallet/balance").json()["balance"]
        r = primary_user["session"].post(f"{API}/wallet/deposit-pix", json={"amount": 100.0})
        assert r.status_code == 200
        data = r.json()
        assert data["amount"] == 100.0
        assert "pix_key" in data and "qr_code" in data
        assert data["status"] == "completed"
        assert data["new_balance"] == pytest.approx(before + 100.0)
        # Verify persisted
        after = primary_user["session"].get(f"{API}/wallet/balance").json()["balance"]
        assert after == pytest.approx(before + 100.0)

    def test_deposit_below_minimum(self, primary_user):
        r = primary_user["session"].post(f"{API}/wallet/deposit-pix", json={"amount": 5.0})
        assert r.status_code == 400

    def test_deposit_above_maximum(self, primary_user):
        r = primary_user["session"].post(f"{API}/wallet/deposit-pix", json={"amount": 20000.0})
        assert r.status_code == 400

    def test_deposit_unauthenticated(self):
        r = requests.post(f"{API}/wallet/deposit-pix", json={"amount": 100.0})
        assert r.status_code == 401

    def test_withdraw_below_minimum(self, primary_user):
        r = primary_user["session"].post(f"{API}/wallet/withdraw", json={
            "amount": 10.0, "pix_key": "test@pix.com", "pix_key_type": "email"
        })
        assert r.status_code == 400

    def test_withdraw_requires_total_bet_100(self):
        """A fresh user with deposit but no betting cannot withdraw."""
        s = requests.Session()
        phone = make_phone()
        s.post(f"{API}/auth/register", json={
            "phone": phone, "password": "senha123", "confirm_password": "senha123"
        })
        s.post(f"{API}/wallet/deposit-pix", json={"amount": 200.0})
        r = s.post(f"{API}/wallet/withdraw", json={
            "amount": 50.0, "pix_key": "test@pix.com", "pix_key_type": "email"
        })
        assert r.status_code == 400
        assert "apostar" in r.json()["detail"].lower() or "100" in r.json()["detail"]

    def test_withdraw_success_after_betting(self):
        """Bet enough then withdraw."""
        s = requests.Session()
        phone = make_phone()
        s.post(f"{API}/auth/register", json={
            "phone": phone, "password": "senha123", "confirm_password": "senha123"
        })
        s.post(f"{API}/wallet/deposit-pix", json={"amount": 500.0})
        # Bet >= R$ 100 total
        for _ in range(10):
            s.post(f"{API}/games/fortune-tiger/play", json={"bet_amount": 10.0})
        bal = s.get(f"{API}/wallet/balance").json()["balance"]
        if bal < 50:
            s.post(f"{API}/wallet/deposit-pix", json={"amount": 100.0})
        r = s.post(f"{API}/wallet/withdraw", json={
            "amount": 50.0, "pix_key": "11999998888", "pix_key_type": "phone"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert data["amount"] == 50.0

    def test_withdraw_insufficient_balance(self):
        s = requests.Session()
        phone = make_phone()
        s.post(f"{API}/auth/register", json={
            "phone": phone, "password": "senha123", "confirm_password": "senha123"
        })
        # Has only R$10, but min withdraw is R$50 so we test 50 vs 10
        r = s.post(f"{API}/wallet/withdraw", json={
            "amount": 50.0, "pix_key": "test@pix.com", "pix_key_type": "email"
        })
        assert r.status_code == 400  # Insufficient balance

    def test_transactions_listed(self, primary_user):
        r = primary_user["session"].get(f"{API}/wallet/transactions")
        assert r.status_code == 200
        txs = r.json()
        assert isinstance(txs, list)
        # Should include the deposit from earlier test
        assert any(t.get("type") == "deposit" for t in txs)


# ---------- GAMES ----------
class TestGames:
    EXPECTED_IDS = {"fortune-tiger", "fortune-rabbit", "fortune-snake",
                    "fortune-ox", "fortune-mouse", "mina-misteriosa"}

    def test_list_games(self):
        r = requests.get(f"{API}/games")
        assert r.status_code == 200
        games = r.json()
        assert len(games) == 6
        ids = {g["id"] for g in games}
        assert ids == self.EXPECTED_IDS
        for g in games:
            assert g["provider"] == "PG Soft"
            assert isinstance(g["rtp"], (int, float))
            assert len(g["symbols"]) >= 6

    @pytest.mark.parametrize("game_id", list(EXPECTED_IDS))
    def test_play_each_game(self, primary_user, game_id):
        # Ensure balance
        bal = primary_user["session"].get(f"{API}/wallet/balance").json()["balance"]
        if bal < 5:
            primary_user["session"].post(f"{API}/wallet/deposit-pix", json={"amount": 50.0})
        r = primary_user["session"].post(f"{API}/games/{game_id}/play", json={"bet_amount": 1.0})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["game_name"] == game_id
        assert len(data["symbols"]) == 3
        assert data["result"] in ("win", "loss")
        assert "new_balance" in data
        assert data["bet_amount"] == 1.0

    def test_play_invalid_game(self, primary_user):
        r = primary_user["session"].post(f"{API}/games/invalid-game/play", json={"bet_amount": 1.0})
        assert r.status_code == 404

    def test_play_below_min_bet(self, primary_user):
        r = primary_user["session"].post(f"{API}/games/fortune-tiger/play", json={"bet_amount": 0.5})
        assert r.status_code == 400

    def test_play_unauthenticated(self):
        r = requests.post(f"{API}/games/fortune-tiger/play", json={"bet_amount": 1.0})
        assert r.status_code == 401

    def test_game_history(self, primary_user):
        r = primary_user["session"].get(f"{API}/games/history")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) > 0

    def test_recent_winners_public(self):
        r = requests.get(f"{API}/games/recent-winners")
        assert r.status_code == 200
        winners = r.json()
        assert isinstance(winners, list)
        for w in winners:
            assert w["player"].startswith("***")  # anonymized


# ---------- VIP / PROFILE ----------
class TestProfile:
    def test_vip_v0(self):
        s = requests.Session()
        phone = make_phone()
        s.post(f"{API}/auth/register", json={
            "phone": phone, "password": "senha123", "confirm_password": "senha123"
        })
        r = s.get(f"{API}/profile/vip")
        assert r.status_code == 200
        vip = r.json()
        assert vip["current"]["name"] == "V0"
        assert vip["current"]["level"] == 0

    def test_stats(self, primary_user):
        r = primary_user["session"].get(f"{API}/profile/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_games" in data
        assert "total_wins" in data
        assert "total_bet" in data
        assert "total_won" in data
        assert data["total_games"] >= 1  # we played games earlier


# ---------- REDEEM ----------
class TestRedeem:
    def test_redeem_valid_code(self):
        s = requests.Session()
        phone = make_phone()
        s.post(f"{API}/auth/register", json={
            "phone": phone, "password": "senha123", "confirm_password": "senha123"
        })
        before = s.get(f"{API}/wallet/balance").json()["balance"]
        r = s.post(f"{API}/redeem", json={"code": "BEMVINDO10"})
        assert r.status_code == 200
        assert r.json()["amount"] == 10.0
        after = s.get(f"{API}/wallet/balance").json()["balance"]
        assert after == pytest.approx(before + 10.0)

    def test_redeem_case_insensitive(self):
        s = requests.Session()
        phone = make_phone()
        s.post(f"{API}/auth/register", json={
            "phone": phone, "password": "senha123", "confirm_password": "senha123"
        })
        r = s.post(f"{API}/redeem", json={"code": "sonicbet50"})
        assert r.status_code == 200
        assert r.json()["amount"] == 50.0

    def test_redeem_invalid_code(self, primary_user):
        r = primary_user["session"].post(f"{API}/redeem", json={"code": "INVALID999"})
        assert r.status_code == 400

    def test_redeem_already_used(self):
        s = requests.Session()
        phone = make_phone()
        s.post(f"{API}/auth/register", json={
            "phone": phone, "password": "senha123", "confirm_password": "senha123"
        })
        r1 = s.post(f"{API}/redeem", json={"code": "BONUS20"})
        assert r1.status_code == 200
        r2 = s.post(f"{API}/redeem", json={"code": "BONUS20"})
        assert r2.status_code == 400
        assert "já usou" in r2.json()["detail"].lower() or "ja usou" in r2.json()["detail"].lower()


# ---------- REFERRAL ----------
class TestReferral:
    def test_referral_info(self, primary_user):
        r = primary_user["session"].get(f"{API}/referral/info")
        assert r.status_code == 200
        data = r.json()
        assert data["invite_code"] == primary_user["invite_code"]
        assert "invited_count" in data
        assert "total_earned" in data

    def test_referral_bonus_credited_on_signup(self, primary_user):
        # Get referrer balance before
        bal_before = primary_user["session"].get(f"{API}/wallet/balance").json()["balance"]
        # Register new user using primary's invite_code
        new_phone = make_phone()
        r = requests.post(f"{API}/auth/register", json={
            "phone": new_phone, "password": "senha123",
            "confirm_password": "senha123",
            "invite_code": primary_user["invite_code"]
        })
        assert r.status_code == 200
        # Referrer should get +50
        bal_after = primary_user["session"].get(f"{API}/wallet/balance").json()["balance"]
        assert bal_after == pytest.approx(bal_before + 50.0)
        # invited_count should be >=1
        ref = primary_user["session"].get(f"{API}/referral/info").json()
        assert ref["invited_count"] >= 1
        assert ref["total_earned"] >= 50.0


# ---------- CONTACT ----------
class TestContact:
    def test_submit_contact_public(self):
        r = requests.post(f"{API}/contact", json={
            "name": "TEST_Joao", "phone": "11999998888", "message": "Mensagem de teste"
        })
        assert r.status_code == 200
        assert "sucesso" in r.json()["message"].lower()


# ---------- PROMOTIONS ----------
class TestPromotions:
    def test_list_promotions(self):
        r = requests.get(f"{API}/promotions")
        assert r.status_code == 200
        promos = r.json()
        assert len(promos) == 6
        assert all("title" in p and "description" in p for p in promos)
