"""Generates AI icons for the remaining 11 games (non-PG core)."""
import asyncio
import os
import base64
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # noqa: E402

OUTPUT_DIR = Path("/app/frontend/public/game-icons")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
REFERENCE_IMAGE = "/app/scripts/pg_reference.png"

GAMES = [
    {
        "id": "dragon-hatch",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a cute baby orange-red DRAGON character with big eyes peeking out of a cracked golden egg, "
            "surrounded by floating gold coins, sparkles and small flames. Background: warm gradient of purple to "
            "orange with magical sparkles and ancient Chinese motifs. Render title text 'DRAGON HATCH' in big bold curvy "
            "3D logo (gold and red). 3D Pixar style, vibrant saturated colors, glossy textures, dramatic lighting. "
            "Square 1:1. No watermarks."
        ),
    },
    {
        "id": "wild-bandito",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a cool MEXICAN BANDIT cartoon character wearing a sombrero, poncho, and mustache, holding "
            "two golden revolvers, with a sugar skull pattern in the background. Background: warm orange and red "
            "desert sunset with cacti silhouettes, gold coins, and dia de los muertos colorful skulls. Render title "
            "text 'WILD BANDITO' in big bold curvy 3D logo (yellow and red). 3D Pixar style, vibrant saturated "
            "colors, glossy textures. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "mahjong-ways",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: stacks of glossy 3D MAHJONG TILES with Chinese characters (東南西北中發) floating mid-air "
            "in dynamic composition, surrounded by golden Chinese dragons curling around them, with gold coins "
            "and red lanterns. Background: deep red Chinese temple interior with hanging lanterns and golden "
            "filigree patterns. Render title text 'MAHJONG WAYS' in big bold 3D logo (gold). 3D Pixar style, "
            "vibrant saturated colors, glossy textures. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "gates-olympus",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a powerful muscular Greek god ZEUS character with a white beard, glowing eyes and lightning "
            "bolts crackling in his hand, wearing a white robe with gold trim, standing in front of Greek marble "
            "columns. Background: dramatic golden Olympus clouds with electric blue lightning strikes, floating "
            "golden gemstones in jewel colors. Render title text 'GATES OF OLYMPUS' in bold 3D logo (gold). "
            "3D Pixar style, vibrant saturated colors, glossy textures, dramatic lighting. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "sweet-bonanza",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a HUGE pile of colorful candy and fruit in 3D cartoon style — giant lollipops, gummy bears, "
            "shiny red apples, pink strawberries, purple grapes, donuts, and rainbow candy hearts overflowing. "
            "Background: pastel pink and lavender sky with cotton-candy clouds and sparkles. Render title text "
            "'SWEET BONANZA' in big bold curvy 3D logo (pink and yellow). 3D Pixar style, vibrant saturated "
            "colors, glossy textures. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "sugar-rush",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a cute 3D cartoon candy world with a giant decorated CUPCAKE in the center topped with "
            "sprinkles and a cherry, surrounded by floating candies, gumdrops, lollipops and chocolate hearts. "
            "Background: bright candy-coated world in cyan, pink and purple with cute cloud shapes and sparkles. "
            "Render title text 'SUGAR RUSH' in big bold curvy 3D logo (pink and white). 3D Pixar style, vibrant "
            "saturated colors, glossy textures. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "lucky-neko",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a cute Japanese MANEKI-NEKO LUCKY CAT character (orange tabby fur with white belly) with "
            "a red collar and bell, raising one paw, sitting on a pile of gold coins, wearing a small kimono. "
            "Background: red and gold Japanese festival scene with floating cherry blossoms, paper lanterns, and "
            "Japanese characters. Render title text 'LUCKY NEKO' in bold 3D logo (gold and red). 3D Pixar style, "
            "vibrant saturated colors, glossy textures. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "aztec-gold",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a glowing AZTEC GOLDEN MASK / IDOL with intricate carvings and bright jewel eyes, surrounded "
            "by floating Aztec gold coins, emeralds and rubies, in front of a stepped Aztec pyramid temple. "
            "Background: lush jungle with stone Aztec ruins, warm sunset light. Render title text 'AZTEC GOLD' "
            "in big bold curvy 3D logo (gold and green). 3D Pixar style, vibrant saturated colors, glossy textures, "
            "dramatic lighting. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "aviator",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a stylized red 3D airplane (single-prop bush plane) climbing diagonally with a trail of "
            "white smoke and gold sparkles behind it, leaving a multiplier glow ×100 in the sky. Background: "
            "dramatic dark red and black starry sky with white dotted trajectory line. Render title text "
            "'AVIATOR' in big bold 3D logo (red and gold). 3D Pixar style, vibrant saturated colors, glossy "
            "textures, dramatic lighting. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "crazy-time",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a colorful giant 3D MONEY WHEEL game-show wheel with rainbow segments (red, yellow, green, "
            "blue, purple, pink), a golden pointer at top, surrounded by floating dollar signs, coins, and "
            "confetti. Background: festive purple and fuchsia stage with spotlights, sparkles and balloons. "
            "Render title text 'CRAZY TIME' in big bold playful 3D logo (rainbow gradient). 3D Pixar style, "
            "vibrant saturated colors, glossy textures. Square 1:1. No watermarks."
        ),
    },
    {
        "id": "plinko",
        "prompt": (
            "Square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a 3D cartoon PLINKO board with rows of glossy white pegs and a shiny golden ball bouncing "
            "down with motion trails, at the bottom multiplier slots glowing in cyan, green, yellow and red. "
            "Background: deep cyan-to-teal gradient with sparkles, gold coins and floating numbers. Render "
            "title text 'PLINKO' in big bold 3D logo (cyan and gold). 3D Pixar style, vibrant saturated colors, "
            "glossy textures. Square 1:1. No watermarks."
        ),
    },
]


async def generate_one(api_key, reference_b64, game):
    out_path = OUTPUT_DIR / f"{game['id']}.png"
    if out_path.exists():
        print(f"  [{game['id']}] already exists, skipping", flush=True)
        return True
    print(f"  [{game['id']}] generating...", flush=True)
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"icon-{game['id']}",
            system_message=(
                "You are a professional slot game cover artist. Reproduce the visual style "
                "of the reference image: 3D Pixar/Disney cartoon characters, vibrant saturated colors, "
                "festive backgrounds, big curvy 3D title text, glossy textures, square format."
            ),
        )
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        msg = UserMessage(text=game["prompt"], file_contents=[ImageContent(reference_b64)])
        _, images = await chat.send_message_multimodal_response(msg)
        if not images:
            print(f"  [{game['id']}] FAILED: no image", flush=True)
            return False
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(images[0]["data"]))
        print(f"  [{game['id']}] OK -> {out_path.stat().st_size // 1024} KB", flush=True)
        return True
    except Exception as e:
        print(f"  [{game['id']}] ERROR: {e}", flush=True)
        return False


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    with open(REFERENCE_IMAGE, "rb") as f:
        reference_b64 = base64.b64encode(f.read()).decode("utf-8")
    print(f"Generating {len(GAMES)} game icons -> {OUTPUT_DIR}")
    ok, fail = 0, 0
    for game in GAMES:
        success = await generate_one(api_key, reference_b64, game)
        ok += success
        fail += (not success)
    print(f"\nDone. Success: {ok}/{len(GAMES)} Failed: {fail}")
    sys.exit(0 if fail == 0 else 2)


if __name__ == "__main__":
    asyncio.run(main())
