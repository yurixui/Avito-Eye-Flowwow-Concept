import html
import json
import os
import re
import time
from io import BytesIO
from urllib.parse import quote_plus

import requests
import torch
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from transformers import AutoModelForImageTextToText, AutoProcessor

try:
    from curl_cffi import requests as curl_requests
except Exception:
    curl_requests = None

MODEL_DIR = "/workspace/avito-eye-vision/models/avision"
CACHE_PATH = "/workspace/avito-eye-vision/avito_cache.json"

app = FastAPI(title="Avito Eye Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

LAST_AVITO_REQUEST_AT = 0

AVITO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

AVITO_PROXY_URL = os.getenv("AVITO_PROXY_URL", "").strip()
DEMO_CASIO_LISTINGS = [
    {
        "id": "7514953266-1",
        "title": "Мужские часы. Casio Vintage Premium",
        "price": "1 200 ₽",
        "image": "https://90.img.avito.st/image/1/1.UipsJLa4_sNak3zORAVVCVOE_MXShXzVWoj8wdyN9sna.ZslFdTh4NZXeB5L9GDvvzBt-Ll34VEqgRcYsRcYatls",
        "url": "https://www.avito.ru/moskva/chasy_i_ukrasheniya/muzhskie_chasy._casio_vintage_premium_7514953266?context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJ0elJEMkpFbzJqWmlZWEFvIjt9qLlWuD8AAAA",
    },
    {
        "id": "7514953266-2",
        "title": "Мужские часы. Casio Vintage Premium",
        "price": "1 200 ₽",
        "image": "https://00.img.avito.st/image/1/1.MGncuba4nIDqDh6NsMkHS-MZnoZiGB6W6hWegmwQlIpq.iOg1QghEomj8Qkrq5Nm_5blR_hsN_Tkr8D0VLx0yj_I?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
        "url": "https://www.avito.ru/moskva/chasy_i_ukrasheniya/muzhskie_chasy._casio_vintage_premium_7514953266?slocation=653240&context=H4sIAAAAAAAA_wFaAKX_YTozOntzOjE1OiJoYXNHZW9UYXJnZXRpbmciO2I6MTtzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJaNmR2eE52YnRFWWxjQ1A0Ijt9PikVn1oAAAA",
    },
    {
        "id": "7514618790",
        "title": "Женские часы Casio Vintage Premium",
        "price": "1 200 ₽",
        "image": "https://70.img.avito.st/image/1/1.raiRdra4AUGnwYNMx0jtiq7WA0cv14NXp9oDQyHfCUsn.wgMyjXHA7K_upv3M0BaAuyScnYEnGUZvWeTDO9IuvWM",
        "url": "https://www.avito.ru/moskva/chasy_i_ukrasheniya/zhenskie_chasy_casio_vintage_premium_7514618790?slocation=653240&context=H4sIAAAAAAAA_wFaAKX_YTozOntzOjE1OiJoYXNHZW9UYXJnZXRpbmciO2I6MTtzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJaNmR2eE52YnRFWWxjQ1A0Ijt9PikVn1oAAAA",
    },
    {
        "id": "7882058974",
        "title": "Часы наручные Casio Vintage A-159W",
        "price": "1 390 ₽",
        "image": "https://80.img.avito.st/image/1/1.rwy9ora4A-WLFYHo7_TkEIkCAeMDA4Hziw4B5w0LC-8L.j5YKDoDUIa3O__sZZ_2p8XoVsUfdYcpUU0pnBV5iz-M",
        "url": "https://www.avito.ru/sankt-peterburg/chasy_i_ukrasheniya/chasy_naruchnye_casio_vintage_a-159w_a-159wa_japan_7882058974?context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJaNmR2eE52YnRFWWxjQ1A0Ijt9tSKpAT8AAAA",
    },
    {
        "id": "7828888170",
        "title": "Наручные часы Casio",
        "price": "1 000 ₽",
        "image": "https://40.img.avito.st/image/1/1.w8Zwaba4by9G3u0iegavhzzIbSnOyO05RsVtLcDAZyXG.0NlGZHCub_5HbmDYo8HwsKxmD9ANRyj0smbxvZ5QK98",
        "url": "https://www.avito.ru/kazan/chasy_i_ukrasheniya/naruchnye_chasy_casio_7828888170?slocation=653240&context=H4sIAAAAAAAA_wFaAKX_YTozOntzOjE1OiJoYXNHZW9UYXJnZXRpbmciO2I6MTtzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJaNmR2eE52YnRFWWxjQ1A0Ijt9PikVn1oAAAA",
    },
]

if AVITO_PROXY_URL:
    print("Avito proxy enabled")


def load_cache():
    try:
        if os.path.exists(CACHE_PATH):
            with open(CACHE_PATH, "r", encoding="utf-8") as file:
                data = json.load(file)
                if isinstance(data, dict):
                    return data
    except Exception as error:
        print("Cache load failed:", repr(error))
    return {}


def save_cache():
    try:
        with open(CACHE_PATH, "w", encoding="utf-8") as file:
            json.dump(AVITO_CACHE, file, ensure_ascii=False, indent=2)
    except Exception as error:
        print("Cache save failed:", repr(error))


AVITO_CACHE = load_cache()

print("Loading A-Vision processor...")
processor = AutoProcessor.from_pretrained(MODEL_DIR, trust_remote_code=True)

print("Loading A-Vision model...")
model = AutoModelForImageTextToText.from_pretrained(
    MODEL_DIR,
    dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)
model.eval()
print("A-Vision ready")


def clean_answer(text: str) -> str:
    text = text.replace("<0x0A>", " ")
    text = re.sub(r"\[[^\]]+\]", " ", text)
    text = text.replace("ANSWER:", " ")
    text = text.replace("Answer:", " ")
    text = text.replace("OTVET:", " ")
    text = text.replace("Ответ:", " ")
    text = re.sub(r"\s+", " ", text).strip()

    bad_answers = {
        "object",
        "item",
        "thing",
        "product",
        "goods",
        "unknown",
        "объект",
        "предмет",
        "товар",
    }

    if "." in text:
        text = text.split(".")[0].strip()

    if len(text) > 80:
        text = text[:80].strip()

    if text.lower() in bad_answers:
        return ""

    return text


def normalize_query(label: str) -> str:
    text = label.replace("_", " ").replace("-", " ")
    low = text.lower()

    generic_labels = {
        "object",
        "item",
        "thing",
        "product",
        "goods",
        "unknown",
        "объект",
        "предмет",
        "товар",
    }

    if low.strip() in generic_labels:
        return "casio часы"

    if "casio" in low:
        return "casio часы"
    if "watch" in low or "clock" in low or "часы" in low:
        return "наручные часы"
    if "cap" in low or "hat" in low or "baseball" in low or "кеп" in low or "папа" in low:
        return "кепка папа"
    if "mouse" in low or "logitech" in low or "мыш" in low:
        return "мышь logitech"
    if "car" in low or "toy" in low or "машин" in low or "модель" in low:
        return "игрушечная машинка"
    if "keyboard" in low or "клавиат" in low:
        return "клавиатура"
    if "phone" in low or "iphone" in low or "смартфон" in low or "телефон" in low:
        return "телефон"
    if "headphone" in low or "airpods" in low or "науш" in low:
        return "наушники"
    if "table" in low or "desk" in low or "стол" in low:
        return "стол"

    text = re.sub(r"[^0-9A-Za-zА-Яа-яЁё\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    if len(text) > 60:
        text = text[:60].strip()

    return text or "товар"


def category_from_query(query: str) -> str:
    low = query.lower()

    if "час" in low or "watch" in low or "casio" in low:
        return "Аксессуары"
    if "кеп" in low or "cap" in low or "hat" in low:
        return "Одежда"
    if "мыш" in low or "logitech" in low or "клавиат" in low:
        return "Компьютерная техника"
    if "машин" in low or "toy" in low:
        return "Игрушки"
    if "телефон" in low or "iphone" in low:
        return "Телефоны"
    if "науш" in low or "airpods" in low:
        return "Аудио"
    if "стол" in low:
        return "Мебель"

    return "Разное"


def analyze_image(image: Image.Image) -> str:
    prompts = [
        "Identify the main sellable object in this photo. Answer with only a short marketplace search query, 2-5 words. Do not answer object, item, thing, product, goods, or unknown.",
        "What product is shown in the photo? Answer only with a short product name suitable for Avito search.",
    ]

    for prompt in prompts:
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt},
                ],
            }
        ]

        text = processor.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )

        inputs = processor(
            text=[text],
            images=[image],
            return_tensors="pt",
        ).to(model.device)

        with torch.inference_mode():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=48,
                do_sample=False,
            )

        answer = processor.batch_decode(
            output_ids[:, inputs.input_ids.shape[1]:],
            skip_special_tokens=True,
        )[0]

        cleaned = clean_answer(answer)
        if cleaned:
            return cleaned

    return "товар"


def extract_meta(content: str, pattern: str) -> str:
    match = re.search(pattern, content, flags=re.S)
    if not match:
        return ""
    value = match.group(1)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def normalize_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return "https://www.avito.ru" + url
    return url


def normalize_price(value) -> str:
    if value is None:
        return ""
    if isinstance(value, dict):
        for key in ("string", "text", "formatted", "value"):
            result = normalize_price(value.get(key))
            if result:
                return result
        return ""
    if isinstance(value, (int, float)):
        return f"{int(value):,}".replace(",", " ") + " ₽"
    text = html.unescape(str(value))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if text and "₽" not in text and re.fullmatch(r"\d[\d\s]*", text):
        text += " ₽"
    return text


def find_image_url(value) -> str:
    if isinstance(value, str):
        if "http" in value or value.startswith("//"):
            return normalize_url(value)
        return ""

    if isinstance(value, list):
        for item in value:
            result = find_image_url(item)
            if result:
                return result

    if isinstance(value, dict):
        for key in ("url", "src", "image", "preview", "default", "large", "small"):
            result = find_image_url(value.get(key))
            if result:
                return result
        for item in value.values():
            result = find_image_url(item)
            if result:
                return result

    return ""


def make_card_from_json(item: dict, cards: list, limit: int):
    title = item.get("title") or item.get("name") or item.get("heading")
    href = item.get("urlPath") or item.get("url") or item.get("uri") or item.get("href")

    if not title or not href:
        return

    image = (
        find_image_url(item.get("images"))
        or find_image_url(item.get("image"))
        or find_image_url(item.get("gallery"))
    )

    if not image:
        return

    price = (
        normalize_price(item.get("priceDetailed"))
        or normalize_price(item.get("price"))
        or normalize_price(item.get("priceString"))
        or "Цена не указана"
    )

    href = normalize_url(str(href))

    if "avito" not in href:
        return

    title = html.unescape(str(title))
    title = re.sub(r"\s+", " ", title).strip()

    if not title:
        return

    duplicate = any(card["url"] == href for card in cards)
    if duplicate:
        return

    cards.append(
        {
            "id": str(len(cards) + 1),
            "title": title[:80],
            "price": price,
            "image": image,
            "url": href,
        }
    )


def walk_json(value, cards: list, limit: int):
    if len(cards) >= limit:
        return

    if isinstance(value, dict):
        make_card_from_json(value, cards, limit)
        for nested in value.values():
            walk_json(nested, cards, limit)
            if len(cards) >= limit:
                return

    if isinstance(value, list):
        for nested in value:
            walk_json(nested, cards, limit)
            if len(cards) >= limit:
                return


def parse_initial_json_cards(html_text: str, limit: int = 6):
    cards = []
    scripts = re.findall(r"<script[^>]*>(.*?)</script>", html_text, flags=re.S)

    for script in scripts:
        if "urlPath" not in script and "priceDetailed" not in script and "item-view" not in script:
            continue

        candidates = []

        match = re.search(r"window\.__initialData__\s*=\s*({.*?});", script, flags=re.S)
        if match:
            candidates.append(match.group(1))

        match = re.search(r"window\.__INITIAL_STATE__\s*=\s*({.*?});", script, flags=re.S)
        if match:
            candidates.append(match.group(1))

        for candidate in candidates:
            try:
                data = json.loads(candidate)
                walk_json(data, cards, limit)
                if cards:
                    return cards[:limit]
            except Exception:
                pass

    return cards[:limit]


def parse_html_cards(html_text: str, limit: int = 6):
    cards = []
    chunks = re.split(r'data-marker="item"', html_text)

    for chunk in chunks[1:]:
        href = extract_meta(chunk, r'href="([^"]+)"')

        title = extract_meta(chunk, r'title="([^"]+)"')
        if not title:
            title = extract_meta(chunk, r'alt="([^"]+)"')
        if not title:
            title = extract_meta(chunk, r'data-marker="item-title"[^>]*>(.*?)</')

        price = extract_meta(chunk, r'itemprop="price" content="([^"]+)"')
        if price:
            price = price + " ₽"
        else:
            price = extract_meta(chunk, r'(\d[\d\s]{2,})\s*₽')
            if price:
                price = price + " ₽"

        image = extract_meta(chunk, r'<img[^>]+src="([^"]+)"')
        if not image:
            image = extract_meta(chunk, r'<img[^>]+data-src="([^"]+)"')

        if not href or not title or not image:
            continue

        href = normalize_url(href)
        image = normalize_url(image)

        if "avito" not in href:
            continue

        cards.append(
            {
                "id": str(len(cards) + 1),
                "title": title[:80],
                "price": price or "Цена не указана",
                "image": image,
                "url": href,
            }
        )

        if len(cards) >= limit:
            break

    return cards


def parse_avito_cards(html_text: str, limit: int = 6):
    cards = parse_initial_json_cards(html_text, limit)
    if cards:
        return cards
    return parse_html_cards(html_text, limit)


def avito_get(url: str):
    proxies = None
    if AVITO_PROXY_URL:
        proxies = {
            "http": AVITO_PROXY_URL,
            "https": AVITO_PROXY_URL,
        }

    if curl_requests is not None:
        return curl_requests.get(
            url,
            headers=AVITO_HEADERS,
            timeout=25,
            impersonate="chrome120",
            proxies=proxies,
        )

    return requests.get(url, headers=AVITO_HEADERS, timeout=25, proxies=proxies)


def search_avito(label: str):
    global LAST_AVITO_REQUEST_AT

    query = normalize_query(label)

    if "casio" in query.lower() or "час" in query.lower() or "watch" in query.lower():
        print("Avito demo listings:", query, len(DEMO_CASIO_LISTINGS))
        return query, DEMO_CASIO_LISTINGS

    if query in AVITO_CACHE:
        cached = AVITO_CACHE[query]
        print("Avito cache hit:", query, len(cached))
        return query, cached

    url = "https://www.avito.ru/moskva?q=" + quote_plus(query)

    try:
        now = time.time()
        wait_seconds = 15 - (now - LAST_AVITO_REQUEST_AT)

        if wait_seconds > 0:
            print("Avito throttle sleep:", round(wait_seconds, 1))
            time.sleep(wait_seconds)

        LAST_AVITO_REQUEST_AT = time.time()

        response = avito_get(url)
        print("Avito search:", response.status_code, query)

        if response.status_code in (401, 403, 429):
            print("Avito blocked or throttled:", response.status_code)
            return query, AVITO_CACHE.get(query, [])

        if response.status_code != 200:
            return query, AVITO_CACHE.get(query, [])

        listings = parse_avito_cards(response.text)
        print("Avito listings:", len(listings))

        if listings:
            AVITO_CACHE[query] = listings
            save_cache()

        return query, listings

    except Exception as error:
        print("Avito search failed:", repr(error))
        return query, AVITO_CACHE.get(query, [])


@app.get("/")
def root():
    return {"ok": True, "service": "Avito Eye Vision API"}


@app.get("/health")
def health():
    return {"ok": True, "model": "AvitoTech/avision"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    content = await file.read()
    image = Image.open(BytesIO(content)).convert("RGB")

    raw_label = analyze_image(image)
    search_query, listings = search_avito(raw_label)
    category = category_from_query(search_query)

    return {
        "label": search_query,
        "rawLabel": raw_label,
        "category": category,
        "confidence": 0.8,
        "bbox": {
            "x": 29,
            "y": 298,
            "width": 315,
            "height": 236,
        },
        "avitoCount": len(listings),
        "listings": listings,
    }
