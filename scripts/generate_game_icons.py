"""
Generates PG Soft-style game thumbnails using Gemini Nano Banana.
Uses the user's reference screenshot to lock in the visual style.

Run once:  python /app/scripts/generate_game_icons.py
Outputs:   /app/frontend/public/game-icons/<game-id>.png
"""

import asyncio
import os
import base64
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load backend .env for EMERGENT_LLM_KEY
load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # noqa: E402

OUTPUT_DIR = Path("/app/frontend/public/game-icons")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REFERENCE_IMAGE = "/app/scripts/pg_reference.png"

# 6 most popular games (user chose option B)
GAMES = [
    {
        "id": "fortune-tiger",
        "prompt": (
            "A square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a chubby cute golden CHINESE TIGER mascot character, wearing a red Chinese new year outfit "
            "with gold trim, smiling and holding red firecrackers and gold coins, surrounded by exploding gold "
            "coins and red lanterns. Background: festive red and gold Chinese new year scene with depth. "
            "Render the title text 'FORTUNE TIGER' in a bold curvy 3D logo style at the bottom (red and gold). "
            "Style: high quality 3D Pixar/Disney-style render, vibrant saturated colors, dramatic studio lighting, "
            "rich gold, red and yellow palette, glossy textures. Square 1:1 format. No watermarks, no PG logo."
        ),
    },
    {
        "id": "fortune-rabbit",
        "prompt": (
            "A square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a fluffy WHITE RABBIT mascot wearing a red Chinese hat with gold ornaments and a red "
            "traditional Chinese coat with gold patterns, winking adorably, with one paw raised holding a "
            "gold coin. Background: festive pink and blue Chinese new year scene with floating gold coins, "
            "sparkles, and firecrackers. Render the title text 'FORTUNE RABBIT' in a curvy bold 3D logo style "
            "at the bottom (gold and red). Style: high quality 3D Pixar/Disney-style render, vibrant saturated "
            "colors, glossy textures, dramatic lighting. Square 1:1 format. No watermarks, no PG logo."
        ),
    },
    {
        "id": "fortune-snake",
        "prompt": (
            "A square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a friendly cute GREEN AND TEAL CHINESE SNAKE / SERPENT character with big expressive "
            "eyes, smiling with a tongue out, wrapped around a golden Chinese ingot, with red and gold "
            "ribbons flowing. Background: dramatic purple and magenta Chinese festival scene with floating "
            "sparkles and gold coins. Render the title text 'FORTUNE SNAKE' in a bold curvy 3D logo style "
            "at the bottom (gold and red). Style: high quality 3D Pixar/Disney-style render, vibrant "
            "saturated colors, glossy textures. Square 1:1 format. No watermarks, no PG logo."
        ),
    },
    {
        "id": "fortune-ox",
        "prompt": (
            "A square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a muscular humanoid OX / BULL character with horns, wearing a fancy red and gold Chinese "
            "suit with intricate embroidery, holding gold ingots, smiling confidently. Background: warm red and "
            "orange Chinese new year temple scene with floating gold coins, red ribbons, and lanterns. Render "
            "the title text 'FORTUNE OX' in a big curvy 3D logo style at the bottom (gold). Style: high "
            "quality 3D Pixar/Disney-style render, vibrant saturated colors, glossy textures, dramatic "
            "lighting. Square 1:1 format. No watermarks, no PG logo."
        ),
    },
    {
        "id": "fortune-mouse",
        "prompt": (
            "A square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a cute chubby MOUSE / RAT character wearing a red Chinese silk outfit with gold "
            "embroidery and a small Chinese hat, holding a giant gold coin, smiling adorably. Background: "
            "warm golden yellow Chinese festival scene with piles of gold coins everywhere, red lanterns, "
            "and sparkles. Render the title text 'FORTUNE MOUSE' in a bold curvy 3D logo style at the "
            "bottom (red and gold). Style: high quality 3D Pixar/Disney-style render, vibrant saturated "
            "colors, glossy textures. Square 1:1 format. No watermarks, no PG logo."
        ),
    },
    {
        "id": "mina-misteriosa",
        "prompt": (
            "A square mobile slot game thumbnail in the EXACT same 3D cartoon style as the reference image. "
            "Subject: a mysterious treasure mine cave entrance overflowing with giant glowing colorful "
            "gemstones (red, blue, green, purple diamonds), gold coins, and a sparkling pickaxe. A small "
            "cute cartoon miner character peeks from the side with a mining lamp helmet. Background: dark "
            "cave interior with glowing crystals, mystical purple and gold lighting, magical sparkles. "
            "Render the title text 'MINA MISTERIOSA' in a big curvy 3D logo style at the bottom (gold and "
            "purple). Style: high quality 3D Pixar/Disney-style render, vibrant saturated colors, glossy "
            "textures, dramatic atmospheric lighting. Square 1:1 format. No watermarks, no PG logo."
        ),
    },
]


async def generate_one(api_key: str, reference_b64: str, game: dict) -> bool:
    print(f"  [{game['id']}] generating...", flush=True)
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"icon-{game['id']}",
            system_message=(
                "You are a professional slot game cover artist. Reproduce the visual style "
                "of the reference image exactly: 3D Pixar/Disney-style cartoon characters, "
                "vibrant saturated colors, festive backgrounds, big curvy 3D title text, "
                "glossy textures, square format. Generate only the image."
            ),
        )
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
            modalities=["image", "text"]
        )
        msg = UserMessage(
            text=game["prompt"],
            file_contents=[ImageContent(reference_b64)],
        )
        _, images = await chat.send_message_multimodal_response(msg)
        if not images:
            print(f"  [{game['id']}] FAILED: no image returned", flush=True)
            return False
        out_path = OUTPUT_DIR / f"{game['id']}.png"
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(images[0]["data"]))
        size_kb = out_path.stat().st_size // 1024
        print(f"  [{game['id']}] OK -> {out_path.name} ({size_kb} KB)", flush=True)
        return True
    except Exception as e:
        print(f"  [{game['id']}] ERROR: {e}", flush=True)
        return False


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("ERROR: EMERGENT_LLM_KEY missing in /app/backend/.env", file=sys.stderr)
        sys.exit(1)

    with open(REFERENCE_IMAGE, "rb") as f:
        reference_b64 = base64.b64encode(f.read()).decode("utf-8")
    print(f"Reference image loaded ({len(reference_b64) // 1024} KB base64)")
    print(f"Generating {len(GAMES)} game icons -> {OUTPUT_DIR}\n")

    # Run sequentially to keep memory low + clearer logs
    ok, fail = 0, 0
    for game in GAMES:
        success = await generate_one(api_key, reference_b64, game)
        if success:
            ok += 1
        else:
            fail += 1

    print(f"\nDone. Success: {ok}/{len(GAMES)}  Failed: {fail}")
    sys.exit(0 if fail == 0 else 2)


if __name__ == "__main__":
    asyncio.run(main())
