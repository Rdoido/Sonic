"""SonicBet new features tests (iteration 3).

Covers:
- Withdraw rules: min R$20, total_bet >= R$50, valid pix_key_type incl. CNPJ
- Check-in system: status, claim, double-claim block
- Admin panel: gating, overview, users/transactions/contacts listing,
  withdraw approve/reject flow
"""
import os
import random
import string
import pytest
import requests

# --- Resolve BASE_URL ---
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_PHONE = "11999999999"
PASSWORD = "Test1234"


# --------------- helpers ----------------

def _gen_phone():
    return "119" + "".join(str(random.randint(0, 9)) for _ in range(8))


def _register(session, phone, password=PASSWORD):
    return session.post(
        f"{API}/auth/register",
        json={"phone": phone, "password": password, "confirm_password": password},
    )


def _login(session, phone, password=PASSWORD):
    return session.post(f"{API}/auth/login", json={"phone": phone, "password": password})


def _register_or_login(session, phone, password=PASSWORD):
    """Try register; if user already exists, login instead. Returns the user JSON."""
    r = _register(session, phone, password)
    if r.status_code == 200:
        return r.json()
    # fallback to login
    r = _login(session, phone, password)
    assert r.status_code == 200, f"register+login failed for {phone}: {r.status_code} {r.text}"
    return r.json()


def _deposit(session, amount):
    return session.post(f"{API}/wallet/deposit-pix", json={"amount": amount})


def _play(session, game_id, bet):
    return session.post(f"{API}/games/{game_id}/play", json={"bet_amount": bet})


def _accumulate_bets(session, total=60):
    """Deposit enough then play games until total_bet>=total."""
    # Deposit a generous amount so we don't go broke
    dep = _deposit(session, 100)
    assert dep.status_code == 200, dep.text
    bet_so_far = 0.0
    attempts = 0
    while bet_so_far < total and attempts < 50:
        r = _play(session, "fortune-tiger", 5)
        assert r.status_code == 200, r.text
        bet_so_far += 5
        attempts += 1
    return bet_so_far


# --------------- fixtures ----------------

@pytest.fixture(scope="module")
def fresh_session():
    """Per-test fresh authenticated user (welcome bonus only)."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    phone = _gen_phone()
    r = _register(s, phone)
    assert r.status_code == 200, r.text
    s._phone = phone  # type: ignore[attr-defined]
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # Try register; if already in DB (previous runs), just login.
    _register_or_login(s, ADMIN_PHONE)
    # Confirm we have a valid session
    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200, me.text
    return s


# ============================================================
# WITHDRAW TESTS
# ============================================================

class TestWithdraw:
    def test_withdraw_below_minimum(self):
        s = requests.Session(); s.headers.update({"Content-Type": "application/json"})
        _register(s, _gen_phone())
        r = s.post(f"{API}/wallet/withdraw", json={
            "amount": 19, "pix_key": "user@test.com", "pix_key_type": "email"
        })
        assert r.status_code == 400
        assert "Saque mínimo" in r.json().get("detail", "")

    def test_withdraw_invalid_pix_type(self):
        s = requests.Session(); s.headers.update({"Content-Type": "application/json"})
        _register(s, _gen_phone())
        r = s.post(f"{API}/wallet/withdraw", json={
            "amount": 25, "pix_key": "anything", "pix_key_type": "bitcoin"
        })
        assert r.status_code == 400
        assert "Tipo de chave PIX inválido" in r.json().get("detail", "")

    def test_withdraw_blocks_when_total_bet_lt_50(self):
        s = requests.Session(); s.headers.update({"Content-Type": "application/json"})
        _register(s, _gen_phone())
        # Deposit so balance is sufficient but skip betting
        assert _deposit(s, 30).status_code == 200
        r = s.post(f"{API}/wallet/withdraw", json={
            "amount": 20, "pix_key": "12345678901234", "pix_key_type": "cnpj"
        })
        assert r.status_code == 400
        assert "apostar pelo menos R$ 50" in r.json().get("detail", "")

    def test_withdraw_succeeds_with_cnpj_after_50_bet(self):
        s = requests.Session(); s.headers.update({"Content-Type": "application/json"})
        _register(s, _gen_phone())
        # Make sure user has played at least R$ 50 in bets
        _accumulate_bets(s, total=60)
        # Sanity: balance should be enough (>=R$20)
        bal = s.get(f"{API}/wallet/balance").json()["balance"]
        if bal < 20:
            # top up
            _deposit(s, 50)

        r = s.post(f"{API}/wallet/withdraw", json={
            "amount": 20, "pix_key": "12345678000199", "pix_key_type": "cnpj"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert data["amount"] == 20
        assert "transaction_id" in data

    @pytest.mark.parametrize("pix_type,pix_key", [
        ("cpf", "12345678901"),
        ("email", "user@example.com"),
        ("phone", "11987654321"),
        ("random", "abcdef-1234-5678"),
    ])
    def test_withdraw_accepts_all_valid_pix_types(self, pix_type, pix_key):
        s = requests.Session(); s.headers.update({"Content-Type": "application/json"})
        _register(s, _gen_phone())
        _accumulate_bets(s, total=60)
        r = s.post(f"{API}/wallet/withdraw", json={
            "amount": 20, "pix_key": pix_key, "pix_key_type": pix_type
        })
        assert r.status_code == 200, f"{pix_type} -> {r.status_code} {r.text}"
        assert r.json()["status"] == "pending"


# ============================================================
# CHECK-IN TESTS
# ============================================================

class TestCheckin:
    def test_status_requires_auth(self):
        r = requests.get(f"{API}/checkin/status")
        assert r.status_code == 401

    def test_status_initial_state(self, fresh_session):
        r = fresh_session.get(f"{API}/checkin/status")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["claimed_today"] is False
        assert data["streak"] == 0
        assert isinstance(data["rewards"], list) and len(data["rewards"]) == 7
        assert data["rewards"][0] == 5.0
        assert data["next_reward"] == 5.0
        # Total = 5+10+15+25+40+75+150 = 320
        assert data["total_program"] == 320.0

    def test_claim_credits_wallet_day1_and_blocks_double_claim(self):
        # use isolated user for this test
        s = requests.Session(); s.headers.update({"Content-Type": "application/json"})
        _register(s, _gen_phone())

        bal_before = s.get(f"{API}/wallet/balance").json()["balance"]

        r = s.post(f"{API}/checkin/claim")
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["amount"] == 5.0
        assert body["day"] == 1

        bal_after = s.get(f"{API}/wallet/balance").json()["balance"]
        assert bal_after == pytest.approx(bal_before + 5.0)

        status = s.get(f"{API}/checkin/status").json()
        assert status["claimed_today"] is True
        assert status["streak"] == 1

        # Second claim same day must fail
        r2 = s.post(f"{API}/checkin/claim")
        assert r2.status_code == 400
        assert "já fez check-in hoje" in r2.json().get("detail", "")


# ============================================================
# ADMIN TESTS
# ============================================================

class TestAdmin:
    def test_admin_me_non_admin(self, fresh_session):
        r = fresh_session.get(f"{API}/admin/me")
        assert r.status_code == 200
        body = r.json()
        assert body["is_admin"] is False

    def test_admin_overview_forbidden_for_non_admin(self, fresh_session):
        r = fresh_session.get(f"{API}/admin/overview")
        assert r.status_code == 403

    def test_admin_users_forbidden_for_non_admin(self, fresh_session):
        r = fresh_session.get(f"{API}/admin/users")
        assert r.status_code == 403

    def test_admin_me_admin_true(self, admin_session):
        r = admin_session.get(f"{API}/admin/me")
        assert r.status_code == 200
        body = r.json()
        assert body["is_admin"] is True
        assert body["phone"] == ADMIN_PHONE

    def test_admin_overview_returns_metrics(self, admin_session):
        r = admin_session.get(f"{API}/admin/overview")
        assert r.status_code == 200, r.text
        data = r.json()
        # Validate required metric keys exist
        for k in ("total_users", "pending_withdraws"):
            assert k in data, f"missing key {k} in overview"
        assert isinstance(data["total_users"], int)
        assert data["total_users"] >= 1

    def test_admin_users_returns_list(self, admin_session):
        r = admin_session.get(f"{API}/admin/users")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_transactions_returns_list(self, admin_session):
        r = admin_session.get(f"{API}/admin/transactions")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_contacts_returns_list(self, admin_session):
        r = admin_session.get(f"{API}/admin/contacts")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_approve_withdraw_flow(self, admin_session):
        # Create a fresh user, bet to >=50, then withdraw
        user_session = requests.Session()
        user_session.headers.update({"Content-Type": "application/json"})
        _register(user_session, _gen_phone())
        _accumulate_bets(user_session, total=60)

        wr = user_session.post(f"{API}/wallet/withdraw", json={
            "amount": 20, "pix_key": "approve@test.com", "pix_key_type": "email"
        })
        assert wr.status_code == 200, wr.text
        tx_id = wr.json()["transaction_id"]

        # Approve as admin
        ar = admin_session.post(f"{API}/admin/withdraw/{tx_id}/approve")
        assert ar.status_code == 200, ar.text

        # Approving again should fail (no longer pending)
        ar2 = admin_session.post(f"{API}/admin/withdraw/{tx_id}/approve")
        assert ar2.status_code in (400, 404)

    def test_admin_reject_withdraw_refunds_user(self, admin_session):
        user_session = requests.Session()
        user_session.headers.update({"Content-Type": "application/json"})
        _register(user_session, _gen_phone())
        _accumulate_bets(user_session, total=60)

        bal_before_withdraw = user_session.get(f"{API}/wallet/balance").json()["balance"]
        wr = user_session.post(f"{API}/wallet/withdraw", json={
            "amount": 20, "pix_key": "reject@test.com", "pix_key_type": "email"
        })
        assert wr.status_code == 200, wr.text
        tx_id = wr.json()["transaction_id"]

        bal_after_withdraw = user_session.get(f"{API}/wallet/balance").json()["balance"]
        assert bal_after_withdraw == pytest.approx(bal_before_withdraw - 20)

        # Reject as admin
        rj = admin_session.post(f"{API}/admin/withdraw/{tx_id}/reject")
        assert rj.status_code == 200, rj.text

        # Verify user got refund
        bal_after_reject = user_session.get(f"{API}/wallet/balance").json()["balance"]
        assert bal_after_reject == pytest.approx(bal_after_withdraw + 20), (
            f"Expected refund: before_reject={bal_after_withdraw}, after_reject={bal_after_reject}"
        )
