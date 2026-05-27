from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import uuid
import random
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta


# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# App
app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============= MODELS =============

class UserRegister(BaseModel):
    phone: str
    password: str
    confirm_password: str
    invite_code: Optional[str] = None

class UserLogin(BaseModel):
    phone: str
    password: str

class DepositRequest(BaseModel):
    amount: float

class WithdrawRequest(BaseModel):
    amount: float
    pix_key: str
    pix_key_type: str  # cpf, email, phone, random

class PlayGameRequest(BaseModel):
    bet_amount: float

class ContactForm(BaseModel):
    name: str
    phone: str
    message: str

class RedeemCodeRequest(BaseModel):
    code: str


# ============= HELPERS =============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, phone: str) -> str:
    payload = {
        "sub": user_id,
        "phone": phone,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def normalize_phone(phone: str) -> str:
    """Remove non-digits from phone and strip BR country code if present"""
    digits = ''.join(filter(str.isdigit, phone))
    # Strip leading '55' (Brazil country code) if total length is 12-13
    if len(digits) in (12, 13) and digits.startswith("55"):
        digits = digits[2:]
    return digits


def generate_public_id() -> str:
    """Generate 10-digit numeric public ID"""
    return str(random.randint(1000000000, 9999999999))


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_or_create_wallet(user_id: str) -> dict:
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        wallet = {
            "user_id": user_id,
            "balance": 0.0,
            "bonus_balance": 0.0,
            "currency": "BRL",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wallets.insert_one(wallet.copy())
    return wallet


def calculate_vip_level(total_bet: float) -> dict:
    """Calculate VIP level based on total bet"""
    levels = [
        {"level": 0, "name": "V0", "min": 0, "max": 100, "bonus": 0},
        {"level": 1, "name": "V1", "min": 100, "max": 500, "bonus": 5},
        {"level": 2, "name": "V2", "min": 500, "max": 2000, "bonus": 10},
        {"level": 3, "name": "V3", "min": 2000, "max": 5000, "bonus": 25},
        {"level": 4, "name": "V4", "min": 5000, "max": 10000, "bonus": 50},
        {"level": 5, "name": "V5", "min": 10000, "max": 999999999, "bonus": 100},
    ]
    
    current = levels[0]
    next_level = levels[1]
    for i, lvl in enumerate(levels):
        if total_bet >= lvl["min"] and total_bet < lvl["max"]:
            current = lvl
            next_level = levels[i + 1] if i + 1 < len(levels) else lvl
            break
    
    return {
        "current": current,
        "next": next_level,
        "total_bet": total_bet,
        "progress": total_bet - current["min"],
        "needed": next_level["min"] - total_bet if next_level["min"] > total_bet else 0
    }


# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")
    
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 6 caracteres")
    
    phone = normalize_phone(data.phone)
    if len(phone) < 10 or len(phone) > 11:
        raise HTTPException(status_code=400, detail="Telefone inválido")
    
    # Check uniqueness
    existing = await db.users.find_one({"phone": phone})
    if existing:
        raise HTTPException(status_code=400, detail="Telefone já cadastrado")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    public_id = generate_public_id()
    
    user_doc = {
        "user_id": user_id,
        "public_id": public_id,
        "phone": phone,
        "password_hash": hash_password(data.password),
        "avatar": f"https://api.dicebear.com/7.x/adventurer/svg?seed={user_id}",
        "vip_level": 0,
        "total_bet": 0.0,
        "invite_code": uuid.uuid4().hex[:8].upper(),
        "invited_by": data.invite_code,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("_id", None)
    
    # Create wallet with welcome bonus
    welcome_bonus = 10.0  # R$ 10 demo bonus
    await db.wallets.insert_one({
        "user_id": user_id,
        "balance": welcome_bonus,
        "bonus_balance": 0.0,
        "currency": "BRL",
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Bonus for referrer
    if data.invite_code:
        referrer = await db.users.find_one({"invite_code": data.invite_code.upper()})
        if referrer:
            await db.wallets.update_one(
                {"user_id": referrer["user_id"]},
                {"$inc": {"balance": 50.0}}
            )
            await db.transactions.insert_one({
                "transaction_id": f"REF{uuid.uuid4().hex[:8].upper()}",
                "user_id": referrer["user_id"],
                "type": "referral_bonus",
                "amount": 50.0,
                "status": "completed",
                "description": f"Bônus por convite de {phone}",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    # Create token and set cookie
    token = create_access_token(user_id, phone)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Return user without password
    user_doc.pop("password_hash", None)
    return user_doc


@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    phone = normalize_phone(data.phone)
    
    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Telefone ou senha inválidos")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Telefone ou senha inválidos")
    
    token = create_access_token(user["user_id"], phone)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user.pop("password_hash", None)
    return user


@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Desconectado com sucesso"}


# ============= WALLET ENDPOINTS =============

@api_router.get("/wallet/balance")
async def get_balance(request: Request):
    user = await get_current_user(request)
    wallet = await get_or_create_wallet(user["user_id"])
    return wallet


@api_router.post("/wallet/deposit-pix")
async def deposit_pix(data: DepositRequest, request: Request):
    user = await get_current_user(request)
    
    if data.amount < 10:
        raise HTTPException(status_code=400, detail="Depósito mínimo: R$ 10,00")
    if data.amount > 10000:
        raise HTTPException(status_code=400, detail="Depósito máximo: R$ 10.000,00")
    
    transaction_id = f"PIX{uuid.uuid4().hex[:10].upper()}"
    pix_key = "pix@sonicbet.com.br"
    qr_code = f"00020126580014br.gov.bcb.pix0136{uuid.uuid4()}520400005303986540{data.amount:.2f}5802BR6009SonicBet62070503***6304ABCD"
    
    # Simulate instant deposit
    wallet = await get_or_create_wallet(user["user_id"])
    new_balance = wallet["balance"] + data.amount
    
    await db.wallets.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "balance": new_balance,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.transactions.insert_one({
        "transaction_id": transaction_id,
        "user_id": user["user_id"],
        "type": "deposit",
        "method": "pix",
        "amount": data.amount,
        "status": "completed",
        "pix_key": pix_key,
        "qr_code": qr_code,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "transaction_id": transaction_id,
        "pix_key": pix_key,
        "qr_code": qr_code,
        "amount": data.amount,
        "new_balance": new_balance,
        "status": "completed"
    }


@api_router.post("/wallet/withdraw")
async def withdraw(data: WithdrawRequest, request: Request):
    user = await get_current_user(request)
    
    if data.amount < 20:
        raise HTTPException(status_code=400, detail="Saque mínimo: R$ 20,00")
    
    valid_types = {"cpf", "cnpj", "email", "phone", "random"}
    if data.pix_key_type not in valid_types:
        raise HTTPException(status_code=400, detail="Tipo de chave PIX inválido")
    if not data.pix_key or not data.pix_key.strip():
        raise HTTPException(status_code=400, detail="Informe sua chave PIX")
    
    wallet = await get_or_create_wallet(user["user_id"])
    if wallet["balance"] < data.amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    # Check minimum bet requirement (must have bet at least R$ 50 to prevent bonus abuse)
    if user.get("total_bet", 0) < 50:
        raise HTTPException(
            status_code=400,
            detail=f"Você precisa apostar pelo menos R$ 50,00 antes de sacar. Faltam R$ {50 - user.get('total_bet', 0):.2f}"
        )
    
    transaction_id = f"WTH{uuid.uuid4().hex[:10].upper()}"
    
    # Deduct from wallet
    await db.wallets.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "balance": wallet["balance"] - data.amount,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.transactions.insert_one({
        "transaction_id": transaction_id,
        "user_id": user["user_id"],
        "type": "withdraw",
        "method": "pix",
        "amount": data.amount,
        "status": "pending",
        "pix_key": data.pix_key,
        "pix_key_type": data.pix_key_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "transaction_id": transaction_id,
        "amount": data.amount,
        "status": "pending",
        "message": "Saque solicitado! Será processado em até 24h."
    }


@api_router.get("/wallet/transactions")
async def get_transactions(request: Request, limit: int = 50):
    user = await get_current_user(request)
    
    txs = await db.transactions.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return txs


# ============= GAME ENDPOINTS =============

GAMES = {
    "fortune-tiger": {
        "name": "Fortune Tiger",
        "provider": "PG Soft",
        "rtp": 96.81,
        "symbols": ["🐯", "💎", "🎰", "🔔", "⭐", "7️⃣", "🀄", "🥇"],
    },
    "fortune-rabbit": {
        "name": "Fortune Rabbit",
        "provider": "PG Soft",
        "rtp": 96.75,
        "symbols": ["🐰", "🥕", "💰", "🌟", "🎲", "🍀", "🥚", "🎁"],
    },
    "fortune-snake": {
        "name": "Fortune Snake",
        "provider": "PG Soft",
        "rtp": 96.50,
        "symbols": ["🐍", "💎", "🌿", "🎰", "🔥", "💚", "⚡", "👑"],
    },
    "fortune-ox": {
        "name": "Fortune Ox",
        "provider": "PG Soft",
        "rtp": 96.71,
        "symbols": ["🐂", "🟡", "🎰", "🔔", "💰", "🥇", "🀄", "⭐"],
    },
    "fortune-mouse": {
        "name": "Fortune Mouse",
        "provider": "PG Soft",
        "rtp": 96.96,
        "symbols": ["🐭", "🧀", "💰", "🎰", "🍀", "⭐", "🥇", "🎁"],
    },
    "mina-misteriosa": {
        "name": "Mina Misteriosa",
        "provider": "PG Soft",
        "rtp": 97.00,
        "symbols": ["💎", "⛏️", "💰", "🪙", "🟡", "🔥", "👑", "✨"],
    },
    "dragon-hatch": {
        "name": "Dragon Hatch",
        "provider": "PG Soft",
        "rtp": 96.71,
        "symbols": ["🐉", "🥚", "🔥", "💎", "👑", "⚡", "🌟", "💰"],
    },
    "wild-bandito": {
        "name": "Wild Bandito",
        "provider": "PG Soft",
        "rtp": 96.71,
        "symbols": ["🤠", "🌵", "💰", "🔫", "🎰", "🥇", "⭐", "🌶️"],
    },
    "mahjong-ways": {
        "name": "Mahjong Ways",
        "provider": "PG Soft",
        "rtp": 96.95,
        "symbols": ["🀄", "🐉", "💰", "🎴", "🥇", "🌟", "🏮", "👑"],
    },
    "gates-olympus": {
        "name": "Gates of Olympus",
        "provider": "Pragmatic Play",
        "rtp": 96.50,
        "symbols": ["⚡", "👑", "💎", "🏛️", "🌟", "💰", "🔱", "🥇"],
    },
    "sweet-bonanza": {
        "name": "Sweet Bonanza",
        "provider": "Pragmatic Play",
        "rtp": 96.51,
        "symbols": ["🍬", "🍭", "🍓", "🍩", "🧁", "🍇", "🍉", "💎"],
    },
    "sugar-rush": {
        "name": "Sugar Rush",
        "provider": "Pragmatic Play",
        "rtp": 96.50,
        "symbols": ["🍰", "🍬", "🧁", "🍭", "🍪", "🍦", "💗", "💜"],
    },
    "lucky-neko": {
        "name": "Lucky Neko",
        "provider": "JILI",
        "rtp": 96.50,
        "symbols": ["🐱", "🪙", "🏮", "💰", "🎰", "🥇", "🌟", "🎴"],
    },
    "aztec-gold": {
        "name": "Aztec Gold",
        "provider": "JILI",
        "rtp": 96.40,
        "symbols": ["👑", "🏛️", "💰", "🥇", "🌞", "🐍", "💎", "🗿"],
    },
    "aviator": {
        "name": "Aviator",
        "provider": "Spribe",
        "rtp": 97.00,
        "symbols": ["✈️", "🚀", "💰", "📈", "🔥", "⭐", "💎", "🥇"],
    },
    "crazy-time": {
        "name": "Crazy Time",
        "provider": "Evolution",
        "rtp": 96.08,
        "symbols": ["🎡", "⭐", "💰", "🎰", "🎲", "👑", "🎁", "💎"],
    },
    "plinko": {
        "name": "Plinko",
        "provider": "Spribe",
        "rtp": 97.00,
        "symbols": ["🟡", "🔴", "🟢", "🔵", "🟣", "🟠", "💰", "⭐"],
    },
}


@api_router.get("/games")
async def list_games():
    return [
        {"id": gid, **g}
        for gid, g in GAMES.items()
    ]


@api_router.post("/games/{game_id}/play")
async def play_game(game_id: str, data: PlayGameRequest, request: Request):
    user = await get_current_user(request)
    
    if game_id not in GAMES:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    
    if data.bet_amount < 1:
        raise HTTPException(status_code=400, detail="Aposta mínima: R$ 1,00")
    
    wallet = await get_or_create_wallet(user["user_id"])
    if wallet["balance"] < data.bet_amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    game = GAMES[game_id]
    
    # 42% win chance
    is_win = random.random() < 0.42
    symbols = [random.choice(game["symbols"]) for _ in range(3)]
    
    if is_win:
        # Match all 3 = jackpot
        if random.random() < 0.05:
            symbols = [symbols[0]] * 3
            multiplier = random.choice([10.0, 25.0, 50.0])
        else:
            multiplier = random.choice([1.5, 2.0, 3.0, 5.0])
        win_amount = data.bet_amount * multiplier
        result = "win"
    else:
        win_amount = 0
        result = "loss"
    
    new_balance = wallet["balance"] - data.bet_amount + win_amount
    
    await db.wallets.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "balance": new_balance,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update total_bet for VIP progression
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"total_bet": data.bet_amount}}
    )
    
    game_doc = {
        "game_id": f"game_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "game_name": game_id,
        "game_title": game["name"],
        "bet_amount": data.bet_amount,
        "win_amount": win_amount,
        "result": result,
        "symbols": symbols,
        "played_at": datetime.now(timezone.utc).isoformat()
    }
    await db.game_history.insert_one(game_doc)
    game_doc.pop("_id", None)
    
    return {
        **game_doc,
        "new_balance": new_balance,
        "multiplier": win_amount / data.bet_amount if win_amount > 0 else 0
    }


@api_router.get("/games/history")
async def game_history(request: Request, limit: int = 50):
    user = await get_current_user(request)
    
    history = await db.game_history.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("played_at", -1).limit(limit).to_list(limit)
    
    return history


@api_router.get("/games/recent-winners")
async def recent_winners(limit: int = 20):
    wins = await db.game_history.find(
        {"result": "win"},
        {"_id": 0}
    ).sort("played_at", -1).limit(limit).to_list(limit)
    
    winners = []
    for w in wins:
        user = await db.users.find_one(
            {"user_id": w["user_id"]},
            {"_id": 0, "phone": 1, "public_id": 1}
        )
        if user:
            # Anonymize phone: 11999998888 -> ***998888
            phone = user.get("phone", "")
            masked = f"***{phone[-4:]}" if len(phone) >= 4 else "***"
            winners.append({
                "player": masked,
                "game": w["game_title"],
                "amount": w["win_amount"],
                "time": w["played_at"]
            })
    
    return winners


# ============= VIP / PROFILE =============

@api_router.get("/profile/vip")
async def get_vip(request: Request):
    user = await get_current_user(request)
    return calculate_vip_level(user.get("total_bet", 0))


@api_router.get("/profile/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    
    # Count games
    total_games = await db.game_history.count_documents({"user_id": user["user_id"]})
    total_wins = await db.game_history.count_documents({"user_id": user["user_id"], "result": "win"})
    
    # Total amounts
    pipeline = [
        {"$match": {"user_id": user["user_id"]}},
        {"$group": {
            "_id": None,
            "total_bet": {"$sum": "$bet_amount"},
            "total_won": {"$sum": "$win_amount"}
        }}
    ]
    
    result = await db.game_history.aggregate(pipeline).to_list(1)
    totals = result[0] if result else {"total_bet": 0, "total_won": 0}
    
    return {
        "total_games": total_games,
        "total_wins": total_wins,
        "total_bet": totals.get("total_bet", 0),
        "total_won": totals.get("total_won", 0)
    }


# ============= REDEEM CODE =============

VALID_CODES = {
    "BEMVINDO10": 10.0,
    "SONICBET50": 50.0,
    "BONUS20": 20.0,
}


@api_router.post("/redeem")
async def redeem_code(data: RedeemCodeRequest, request: Request):
    user = await get_current_user(request)
    
    code = data.code.upper().strip()
    
    if code not in VALID_CODES:
        raise HTTPException(status_code=400, detail="Código inválido")
    
    # Check if user already used this code
    existing = await db.redeemed_codes.find_one({
        "user_id": user["user_id"],
        "code": code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Você já usou este código")
    
    amount = VALID_CODES[code]
    
    # Add to wallet
    await db.wallets.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"balance": amount}}
    )
    
    # Record redemption
    await db.redeemed_codes.insert_one({
        "user_id": user["user_id"],
        "code": code,
        "amount": amount,
        "redeemed_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.transactions.insert_one({
        "transaction_id": f"RDM{uuid.uuid4().hex[:8].upper()}",
        "user_id": user["user_id"],
        "type": "redeem",
        "amount": amount,
        "code": code,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "amount": amount,
        "message": f"Código resgatado! R$ {amount:.2f} adicionados ao seu saldo."
    }


# ============= REFERRAL =============

@api_router.get("/referral/info")
async def referral_info(request: Request):
    user = await get_current_user(request)
    
    # Count invited users
    invited_count = await db.users.count_documents({
        "invited_by": user.get("invite_code")
    })
    
    # Sum referral bonuses
    pipeline = [
        {"$match": {"user_id": user["user_id"], "type": "referral_bonus"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result = await db.transactions.aggregate(pipeline).to_list(1)
    total_earned = result[0]["total"] if result else 0
    
    return {
        "invite_code": user.get("invite_code"),
        "invited_count": invited_count,
        "total_earned": total_earned,
        "bonus_per_invite": 50.0,
        "commission_rate": 0.05
    }


# ============= CONTACT / SUPPORT =============

@api_router.post("/contact")
async def submit_contact(form: ContactForm):
    await db.contacts.insert_one({
        "contact_id": f"ct_{uuid.uuid4().hex[:12]}",
        "name": form.name,
        "phone": form.phone,
        "message": form.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Mensagem enviada com sucesso!"}


# ============= PROMOTIONS =============

@api_router.get("/promotions")
async def list_promotions():
    return [
        {
            "id": "cashback_diario",
            "title": "Cashback Diário 30%",
            "description": "Receba 30% de cashback em suas perdas diárias",
            "type": "cashback",
            "value": 30,
            "color": "#FFA500"
        },
        {
            "id": "cashback_semanal",
            "title": "Cashback Semanal 30%",
            "description": "Receba 30% de cashback em suas perdas semanais",
            "type": "cashback",
            "value": 30,
            "color": "#FFD700"
        },
        {
            "id": "convide_amigo",
            "title": "Convide 1 Pessoa e Ganhe R$ 50",
            "description": "Compartilhe seu código de convite e ganhe R$ 50 por cada amigo cadastrado",
            "type": "referral",
            "value": 50,
            "color": "#32BCAD"
        },
        {
            "id": "bonus_checkin",
            "title": "Bônus de Check-in R$ 320",
            "description": "Faça check-in diário e acumule até R$ 320 em bônus",
            "type": "checkin",
            "value": 320,
            "color": "#FF6B00"
        },
        {
            "id": "rtp_alto",
            "title": "RTP 98.8% + Top Retorno",
            "description": "Os melhores RTPs do mercado em nossos jogos",
            "type": "info",
            "value": 98.8,
            "color": "#22C55E"
        },
        {
            "id": "primeiro_deposito",
            "title": "Primeiro Depósito +100%",
            "description": "Ganhe 100% de bônus no seu primeiro depósito",
            "type": "deposit_bonus",
            "value": 100,
            "color": "#9D4CDD"
        }
    ]


# ============= DAILY CHECK-IN =============

CHECKIN_REWARDS = [5.0, 10.0, 15.0, 25.0, 40.0, 75.0, 150.0]  # 7 days, increasing
CHECKIN_TOTAL = sum(CHECKIN_REWARDS)  # R$ 320


def _today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _yesterday_str() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")


@api_router.get("/checkin/status")
async def checkin_status(request: Request):
    user = await get_current_user(request)
    record = await db.checkins.find_one({"user_id": user["user_id"]}, {"_id": 0})
    today = _today_str()

    if not record:
        return {
            "current_day": 0,
            "claimed_today": False,
            "next_reward": CHECKIN_REWARDS[0],
            "rewards": CHECKIN_REWARDS,
            "total_program": CHECKIN_TOTAL,
            "streak": 0,
        }

    claimed_today = record.get("last_claim_date") == today
    streak = record.get("streak", 0)

    # Reset streak if user missed a day (last claim was not today and not yesterday)
    if not claimed_today and record.get("last_claim_date") != _yesterday_str():
        if streak > 0:
            streak = 0

    # Day index 1..7 (next reward to claim)
    next_day_idx = streak if claimed_today else min(streak, len(CHECKIN_REWARDS) - 1)
    next_reward = CHECKIN_REWARDS[min(next_day_idx, len(CHECKIN_REWARDS) - 1)]

    return {
        "current_day": streak,
        "claimed_today": claimed_today,
        "next_reward": next_reward,
        "rewards": CHECKIN_REWARDS,
        "total_program": CHECKIN_TOTAL,
        "streak": streak,
    }


@api_router.post("/checkin/claim")
async def checkin_claim(request: Request):
    user = await get_current_user(request)
    today = _today_str()
    record = await db.checkins.find_one({"user_id": user["user_id"]})

    if record and record.get("last_claim_date") == today:
        raise HTTPException(status_code=400, detail="Você já fez check-in hoje. Volte amanhã!")

    # Determine streak day
    prev_streak = record.get("streak", 0) if record else 0
    last_date = record.get("last_claim_date") if record else None

    # If last claim was yesterday, continue streak; otherwise reset
    if last_date == _yesterday_str():
        new_streak = prev_streak + 1
    else:
        new_streak = 1

    # Cap streak at 7 (then cycle back)
    day_index = ((new_streak - 1) % len(CHECKIN_REWARDS))
    reward = CHECKIN_REWARDS[day_index]

    # If completed cycle, restart from day 1 next time
    streak_to_save = new_streak if new_streak < len(CHECKIN_REWARDS) else len(CHECKIN_REWARDS)

    # Credit wallet
    await db.wallets.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"balance": reward}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Save check-in record
    await db.checkins.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {
                "user_id": user["user_id"],
                "last_claim_date": today,
                "streak": streak_to_save,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            "$inc": {"total_claimed": reward, "total_claims": 1},
        },
        upsert=True,
    )

    await db.transactions.insert_one({
        "transaction_id": f"CHK{uuid.uuid4().hex[:8].upper()}",
        "user_id": user["user_id"],
        "type": "checkin",
        "amount": reward,
        "day": streak_to_save,
        "status": "completed",
        "description": f"Check-in dia {streak_to_save}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "amount": reward,
        "day": streak_to_save,
        "next_day": (streak_to_save % len(CHECKIN_REWARDS)) + 1,
        "message": f"+R$ {reward:.2f} adicionados ao seu saldo!",
    }


# ============= ADMIN =============

ADMIN_PHONES = os.environ.get("ADMIN_PHONES", "11999999999").split(",")


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("phone") not in ADMIN_PHONES:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return user


@api_router.get("/admin/overview")
async def admin_overview(request: Request):
    await require_admin(request)
    total_users = await db.users.count_documents({})
    total_games = await db.game_history.count_documents({})

    # Sum totals
    pipeline_wallets = [{"$group": {"_id": None, "total_balance": {"$sum": "$balance"}}}]
    wallet_agg = await db.wallets.aggregate(pipeline_wallets).to_list(1)
    total_balance = wallet_agg[0]["total_balance"] if wallet_agg else 0

    pipeline_tx = [
        {"$match": {"type": "deposit", "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    deposit_agg = await db.transactions.aggregate(pipeline_tx).to_list(1)
    total_deposits = deposit_agg[0]["total"] if deposit_agg else 0

    pipeline_w = [
        {"$match": {"type": "withdraw"}},
        {"$group": {"_id": "$status", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    w_agg = await db.transactions.aggregate(pipeline_w).to_list(10)
    withdraws_by_status = {x["_id"]: {"total": x["total"], "count": x["count"]} for x in w_agg}

    pending_withdraws = await db.transactions.count_documents({"type": "withdraw", "status": "pending"})

    new_today = await db.users.count_documents({
        "created_at": {"$gte": _today_str()}
    })

    return {
        "total_users": total_users,
        "new_users_today": new_today,
        "total_balance_in_wallets": total_balance,
        "total_deposits": total_deposits,
        "withdraws_by_status": withdraws_by_status,
        "pending_withdraws": pending_withdraws,
        "total_games_played": total_games,
    }


@api_router.get("/admin/users")
async def admin_list_users(request: Request, limit: int = 50, skip: int = 0):
    await require_admin(request)
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    # Attach wallet balance
    for u in users:
        w = await db.wallets.find_one({"user_id": u["user_id"]}, {"_id": 0, "balance": 1})
        u["balance"] = w["balance"] if w else 0
    return users


@api_router.get("/admin/transactions")
async def admin_list_transactions(request: Request, type: Optional[str] = None, status: Optional[str] = None, limit: int = 100):
    await require_admin(request)
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    txs = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return txs


@api_router.post("/admin/withdraw/{transaction_id}/approve")
async def admin_approve_withdraw(transaction_id: str, request: Request):
    admin = await require_admin(request)
    tx = await db.transactions.find_one({"transaction_id": transaction_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if tx.get("type") != "withdraw" or tx.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Apenas saques pendentes podem ser aprovados")

    await db.transactions.update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "status": "completed",
            "approved_by": admin["user_id"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Saque aprovado", "transaction_id": transaction_id}


@api_router.post("/admin/withdraw/{transaction_id}/reject")
async def admin_reject_withdraw(transaction_id: str, request: Request):
    admin = await require_admin(request)
    tx = await db.transactions.find_one({"transaction_id": transaction_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if tx.get("type") != "withdraw" or tx.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Apenas saques pendentes podem ser rejeitados")

    # Refund the user
    await db.wallets.update_one(
        {"user_id": tx["user_id"]},
        {"$inc": {"balance": tx["amount"]}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.transactions.update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "status": "rejected",
            "rejected_by": admin["user_id"],
            "rejected_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Saque rejeitado e valor estornado", "transaction_id": transaction_id}


@api_router.get("/admin/contacts")
async def admin_list_contacts(request: Request, limit: int = 100):
    await require_admin(request)
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return contacts


@api_router.get("/admin/me")
async def admin_check(request: Request):
    """Check if current user is admin (used by frontend to gate UI)."""
    try:
        user = await get_current_user(request)
        is_admin = user.get("phone") in ADMIN_PHONES
        return {"is_admin": is_admin, "phone": user.get("phone")}
    except HTTPException:
        return {"is_admin": False, "phone": None}


# ============= HEALTH =============

@api_router.get("/")
async def root():
    return {"message": "SonicBet API", "status": "online"}


# Include router and CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("phone", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("invite_code")
    logger.info("SonicBet API started successfully")


@app.on_event("shutdown")
async def shutdown():
    client.close()
