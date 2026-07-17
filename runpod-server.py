import re
from io import BytesIO

import torch
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from transformers import AutoModelForImageTextToText, AutoProcessor

MODEL_DIR = "/workspace/avito-eye-vision/models/avision"

app = FastAPI(title="Avito Eye Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_CASIO_LISTINGS = [
    {
        "id": "7514953266-1",
        "title": "\u041c\u0443\u0436\u0441\u043a\u0438\u0435 \u0447\u0430\u0441\u044b. Casio Vintage Premium",
        "price": "1 200 \u20bd",
        "image": "https://90.img.avito.st/image/1/1.UipsJLa4_sNak3zORAVVCVOE_MXShXzVWoj8wdyN9sna.ZslFdTh4NZXeB5L9GDvvzBt-Ll34VEqgRcYsRcYatls",
        "url": "https://www.avito.ru/moskva/chasy_i_ukrasheniya/muzhskie_chasy._casio_vintage_premium_7514953266?context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJ0elJEMkpFbzJqWmlZWEFvIjt9qLlWuD8AAAA",
    },
    {
        "id": "7514953266-2",
        "title": "\u041c\u0443\u0436\u0441\u043a\u0438\u0435 \u0447\u0430\u0441\u044b. Casio Vintage Premium",
        "price": "1 200 \u20bd",
        "image": "https://00.img.avito.st/image/1/1.MGncuba4nIDqDh6NsMkHS-MZnoZiGB6W6hWegmwQlIpq.iOg1QghEomj8Qkrq5Nm_5blR_hsN_Tkr8D0VLx0yj_I?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
        "url": "https://www.avito.ru/moskva/chasy_i_ukrasheniya/muzhskie_chasy._casio_vintage_premium_7514953266?slocation=653240&context=H4sIAAAAAAAA_wFaAKX_YTozOntzOjE1OiJoYXNHZW9UYXJnZXRpbmciO2I6MTtzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJaNmR2eE52YnRFWWxjQ1A0Ijt9PikVn1oAAAA",
    },
    {
        "id": "7514618790",
        "title": "\u0416\u0435\u043d\u0441\u043a\u0438\u0435 \u0447\u0430\u0441\u044b Casio Vintage Premium",
        "price": "1 200 \u20bd",
        "image": "https://70.img.avito.st/image/1/1.raiRdra4AUGnwYNMx0jtiq7WA0cv14NXp9oDQyHfCUsn.wgMyjXHA7K_upv3M0BaAuyScnYEnGUZvWeTDO9IuvWM",
        "url": "https://www.avito.ru/moskva/chasy_i_ukrasheniya/zhenskie_chasy_casio_vintage_premium_7514618790?slocation=653240&context=H4sIAAAAAAAA_wFaAKX_YTozOntzOjE1OiJoYXNHZW9UYXJnZXRpbmciO2I6MTtzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJaNmR2eE52YnRFWWxjQ1A0Ijt9PikVn1oAAAA",
    },
    {
        "id": "7882058974",
        "title": "\u0427\u0430\u0441\u044b \u043d\u0430\u0440\u0443\u0447\u043d\u044b\u0435 Casio Vintage A-159W",
        "price": "1 390 \u20bd",
        "image": "https://80.img.avito.st/image/1/1.rwy9ora4A-WLFYHo7_TkEIkCAeMDA4Hziw4B5w0LC-8L.j5YKDoDUIa3O__sZZ_2p8XoVsUfdYcpUU0pnBV5iz-M",
        "url": "https://www.avito.ru/sankt-peterburg/chasy_i_ukrasheniya/chasy_naruchnye_casio_vintage_a-159w_a-159wa_japan_7882058974?context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJaNmR2eE52YnRFWWxjQ1A0Ijt9tSKpAT8AAAA",
    },
    {
        "id": "7828888170",
        "title": "\u041d\u0430\u0440\u0443\u0447\u043d\u044b\u0435 \u0447\u0430\u0441\u044b Casio",
        "price": "1 000 \u20bd",
        "image": "https://40.img.avito.st/image/1/1.w8Zwaba4by9G3u0iegavhzzIbSnOyO05RsVtLcDAZyXG.0NlGZHCub_5HbmDYo8HwsKxmD9ANRyj0smbxvZ5QK98",
        "url": "https://www.avito.ru/kazan/chasy_i_ukrasheniya/naruchnye_chasy_casio_7828888170?slocation=653240&context=H4sIAAAAAAAA_wFaAKX_YTozOntzOjE1OiJoYXNHZW9UYXJnZXRpbmciO2I6MTtzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJaNmR2eE52YnRFWWxjQ1A0Ijt9PikVn1oAAAA",
    },
]

DEMO_CAP_LISTINGS = [
    {
        "id": "papa-cap-1",
        "title": "Кепка Папа оригинал",
        "price": "4 836 ₽",
        "image": "https://60.img.avito.st/image/1/1.Bg59i7a4qudLPCjqff84dksrqOHDKijxSyeo5c0iou3L.wjFz3QBmy4qxmFJHuGGs3qtiwwdYWodb7wNa4Mh26jQ",
    },
    {
        "id": "papa-cap-2",
        "title": "Кепка Папа хаски Папино Молоко",
        "price": "5 336 ₽",
        "image": "https://70.img.avito.st/image/1/1.Z7Skhba4y12SMklQ5vR8ouwkyVsaJElLkinJXxQsw1cS._uhD-3tmYeXPiXObyDDdSKPlh4WU19sTf6d0YlzrnH8",
    },
    {
        "id": "papa-cap-3",
        "title": "Кепка папа",
        "price": "1 892 ₽",
        "image": "https://00.img.avito.st/image/1/1.Y1cRP7a4z74niE2zW34rPTyfzbivnk2oJ5PNvKGWx7Sn.CNJ40Lj2DI1-OLnT4WBTAqhrSBrOJflKexj9_BviPVU?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
    {
        "id": "papa-cap-4",
        "title": "Кепка папиномолоко хаски 2025",
        "price": "3 436 ₽",
        "image": "https://40.img.avito.st/image/1/1.n-LBMba4Mwv3hrEG80OmjeuRMQ1_kLEd950xCXGYOwF3.8r_tXpI1gVGokuQLj7Cboi-LZIs1VZ1FYDfbhpAt0gU",
    },
    {
        "id": "papa-cap-5",
        "title": "Оригинал кепочка мама",
        "price": "6 836 ₽",
        "image": "https://10.img.avito.st/image/1/1.YLQ2B7a4zF0AsE5QeioMuRynzluIpk5LAKvOX4auxFeA.dUEaUZBvrqcTOnGgOzO3jZm2cbZPlnnhjOQ8-eQ0PNM?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
    {
        "id": "papa-cap-6",
        "title": "Кепки папа",
        "price": "5 326 ₽",
        "image": "https://90.img.avito.st/image/1/1.evsdgra41hIrNVQfZZMN9HYj1BSjI1QEKy7UEK0r3hir.pHuG97P7yhe-ylos-5o5fM0OJi-_fPgPajPtsv5ZO1g",
    },
]

DEMO_IPHONE_LISTINGS = [
    {
        "id": "iphone-16-1",
        "title": "iPhone 16, 256 ГБ",
        "price": "46 590 ₽",
        "image": "https://20.img.avito.st/image/1/1.Vb9imLa4-VZUL3tbRKVm7Tg5-1DcOXtAVDT7VNIx8VzU.b5md78aUHefEJDNsXCZ3_AhAL8SnVDatAr5sWnps0Cw?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
    {
        "id": "iphone-16-2",
        "title": "iPhone 16, 256 ГБ",
        "price": "37 900 ₽",
        "image": "https://00.img.avito.st/image/1/1.OLeS47a4lF6kVBZT7vNbhLhDllgsQhZIpE-WXCJKnFQk.ApS9BS9S2hdehp0sUh7s6x7xZvwtJuCqMkSyxPuTabc?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
    {
        "id": "iphone-16-3",
        "title": "iPhone 16, 256 ГБ, 2 SIM",
        "price": "55 500 ₽",
        "image": "https://20.img.avito.st/image/1/1.rTE68ra4AdgMRYPVbIzGIBdSA96EU4PODF4D2opbCdKM.L9Bo6f17UYzPDQj6kGwNOl5pXc8pG4BezxXhU4XAB-0?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
    {
        "id": "iphone-16-4",
        "title": "iPhone 16, 128 ГБ, SIM + eSIM",
        "price": "57 890 ₽",
        "image": "https://90.img.avito.st/image/1/1.rxI2m7a4A_sALIH2ZL3IehM7Af2IOoHtADcB-YYyC_GA.oa7yPYqNuc4nkvLsQPaxNZklRLb1ZXjpoYS_01HKM5E",
    },
    {
        "id": "iphone-16-5",
        "title": "iPhone 16, 256 ГБ",
        "price": "39 200 ₽",
        "image": "https://00.img.avito.st/image/1/1.Ya82aba4zUYA3k9LeBgikhzJz0CIyE9QAMXPRIbAxUyA.nypiTs7YhzDO0Mx147ef1lGJfMe4NlmUmw7qHW6cBJw?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
    {
        "id": "iphone-16-6",
        "title": "iPhone 16, 128 ГБ, SIM + eSIM",
        "price": "51 700 ₽",
        "image": "https://90.img.avito.st/image/1/1.2PraZra4dBPs0fYe5mGnhfjGdhVkx_YF7Mp2EWrPfBls.DWGHmDQsgo4KdVOFfpYPv2aUQJUAqIrtqFhvJbpUXDA",
    },
    {
        "id": "iphone-16-7",
        "title": "iPhone 16, 256 ГБ, 2 SIM",
        "price": "57 990 ₽",
        "image": "https://20.img.avito.st/image/1/1.qg1Elra4BuRyIYTpHMy0T2U2BOL6N4TycjoE5vQ_Du7y.A4N479rVoZYFz2wbsQ_EXEI8lS4Sgmg2skhjC0jJa8k?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
]

DEMO_RING_LISTINGS = [
    {
        "id": "silver-ring-1",
        "title": "Кольцо Maison Margiela MM6 Numeric Tabi",
        "price": "928 ₽",
        "image": "https://50.img.avito.st/image/1/1.6tTkn7a4Rj3SKMQwvMSTotA_RDtaPsQr0jNEP1Q2TjdS.dJohVcETmD7DPOS89oUcpAreQe3gjgo1BImBXuL8JaU",
    },
    {
        "id": "silver-ring-2",
        "title": "Кольцо Maison Martin Margiela Оригинал",
        "price": "13 636 ₽",
        "image": "https://70.img.avito.st/image/1/1._p6SW7a4Unek7NB64hywvcf6UHEs-tBhpPdQdSLyWn0k.hJ8djkf5EedKzTuCt6QYx232N_Ov0SAy_aLIH553AYA",
    },
    {
        "id": "silver-ring-3",
        "title": "Кольцо Maison Margiela MM6",
        "price": "984 ₽",
        "image": "https://10.img.avito.st/image/1/1.IzvjG7a4j9LVrA3fqVcqNdm7jdRdug3E1beN0FOyh9hV.knuKPpXD86X9Vyz7tHwApeSZJ3u9xuDDjAiJcn6aJHk?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
    {
        "id": "silver-ring-4",
        "title": "Кольцо maison margiela",
        "price": "564 ₽",
        "image": "https://50.img.avito.st/image/1/1.lYG0Kra4OWiCnbtlknyYt5SKO24Ki7t-goY7agSDMWIC.WDTcm80C6lKQjzqe5lpI9YDjpBK_m3aZVcHRaqkvvIE",
    },
    {
        "id": "silver-ring-5",
        "title": "Кольцо maison margiela",
        "price": "653 ₽",
        "image": "https://00.img.avito.st/image/1/1.lILfU7a4OGvp5Lpm-22h55ryOm1h8rp96f86aW_6MGFp.866ezpT_wVELIbD9Mbfy_cpi4S0cVzVsf1iuTGySMEA?cqp=2.TSzMy-m0u9ojo94xoNTr4TIkcUBjMu1L_y5Z6Lr-VHA-3xfoRpsvf1jN4IBF36LEO13sxOCjYv9KRoXzpmAFvKTQ",
    },
]

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
    text = text.replace("\u041e\u0442\u0432\u0435\u0442:", " ")
    text = re.sub(r"\s+", " ", text).strip()

    if "." in text:
        text = text.split(".")[0].strip()

    if len(text) > 80:
        text = text[:80].strip()

    return text or "\u0442\u043e\u0432\u0430\u0440"


def normalize_query(label: str) -> str:
    text = label.replace("_", " ").replace("-", " ")
    low = text.lower()

    if "casio" in low:
        return "casio \u0447\u0430\u0441\u044b"
    if "watch" in low or "clock" in low or "\u0447\u0430\u0441" in low:
        return "\u043d\u0430\u0440\u0443\u0447\u043d\u044b\u0435 \u0447\u0430\u0441\u044b"
    if "cap" in low or "hat" in low or "baseball" in low or "\u043a\u0435\u043f" in low or "\u043f\u0430\u043f\u0430" in low:
        return "\u043a\u0435\u043f\u043a\u0430 \u043f\u0430\u043f\u0430"
    if "mouse" in low or "logitech" in low or "\u043c\u044b\u0448" in low:
        return "\u043c\u044b\u0448\u044c logitech"
    if "car" in low or "toy" in low or "\u043c\u0430\u0448\u0438\u043d" in low or "\u043c\u043e\u0434\u0435\u043b" in low:
        return "\u0438\u0433\u0440\u0443\u0448\u0435\u0447\u043d\u0430\u044f \u043c\u0430\u0448\u0438\u043d\u043a\u0430"
    if "keyboard" in low or "\u043a\u043b\u0430\u0432\u0438\u0430\u0442" in low:
        return "\u043a\u043b\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0430"
    if "phone" in low or "iphone" in low or "mobile" in low or "\u0430\u0439\u0444\u043e\u043d" in low or "\u0441\u043c\u0430\u0440\u0442\u0444\u043e\u043d" in low or "\u0442\u0435\u043b\u0435\u0444\u043e\u043d" in low or "\u043c\u043e\u0431\u0438\u043b\u044c\u043d" in low:
        return "iPhone 16"
    if "ring" in low or "\u043a\u043e\u043b\u044c\u0446" in low or "\u043a\u043e\u043b\u0435\u0447\u043a" in low or "\u043f\u0435\u0440\u0441\u0442" in low:
        return "\u043a\u043e\u043b\u044c\u0446\u043e \u0441\u0435\u0440\u0435\u0431\u0440\u044f\u043d\u043e\u0435"
    if "headphone" in low or "airpods" in low or "\u043d\u0430\u0443\u0448" in low:
        return "\u043d\u0430\u0443\u0448\u043d\u0438\u043a\u0438"
    if "table" in low or "desk" in low or "\u0441\u0442\u043e\u043b" in low:
        return "\u0441\u0442\u043e\u043b"

    text = re.sub(r"[^0-9A-Za-z\u0410-\u042f\u0430-\u044f\u0401\u0451\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    if len(text) > 60:
        text = text[:60].strip()

    return text or "\u0442\u043e\u0432\u0430\u0440"


def category_from_query(query: str) -> str:
    low = query.lower()

    if "\u0447\u0430\u0441" in low or "watch" in low or "casio" in low:
        return "\u0410\u043a\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044b"
    if "\u043a\u0435\u043f" in low or "cap" in low or "hat" in low:
        return "\u041e\u0434\u0435\u0436\u0434\u0430"
    if "\u043c\u044b\u0448" in low or "logitech" in low or "\u043a\u043b\u0430\u0432\u0438\u0430\u0442" in low:
        return "\u041a\u043e\u043c\u043f\u044c\u044e\u0442\u0435\u0440\u043d\u0430\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0430"
    if "\u043c\u0430\u0448\u0438\u043d" in low or "toy" in low:
        return "\u0418\u0433\u0440\u0443\u0448\u043a\u0438"
    if "\u0442\u0435\u043b\u0435\u0444\u043e\u043d" in low or "\u0430\u0439\u0444\u043e\u043d" in low or "iphone" in low:
        return "\u0422\u0435\u043b\u0435\u0444\u043e\u043d\u044b"
    if "\u043a\u043e\u043b\u044c\u0446" in low or "\u043f\u0435\u0440\u0441\u0442" in low or "ring" in low:
        return "\u0423\u043a\u0440\u0430\u0448\u0435\u043d\u0438\u044f"
    if "\u043d\u0430\u0443\u0448" in low or "airpods" in low:
        return "\u0410\u0443\u0434\u0438\u043e"
    if "\u0441\u0442\u043e\u043b" in low:
        return "\u041c\u0435\u0431\u0435\u043b\u044c"

    return "\u0420\u0430\u0437\u043d\u043e\u0435"


def listings_for_query(query: str):
    low = query.lower()

    if "casio" in low or "\u0447\u0430\u0441" in low or "watch" in low:
        return DEMO_CASIO_LISTINGS
    if "\u043a\u0435\u043f" in low or "\u043f\u0430\u043f\u0430" in low or "cap" in low or "hat" in low or "baseball" in low:
        return DEMO_CAP_LISTINGS
    if "iphone" in low or "\u0430\u0439\u0444\u043e\u043d" in low or "\u0442\u0435\u043b\u0435\u0444\u043e\u043d" in low or "phone" in low or "mobile" in low or "\u0441\u043c\u0430\u0440\u0442\u0444\u043e\u043d" in low or "\u043c\u043e\u0431\u0438\u043b\u044c\u043d" in low:
        return DEMO_IPHONE_LISTINGS
    if "\u043a\u043e\u043b\u044c\u0446" in low or "\u043f\u0435\u0440\u0441\u0442" in low or "ring" in low:
        return DEMO_RING_LISTINGS

    return []


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
                max_new_tokens=40,
                do_sample=False,
            )

        answer = processor.batch_decode(
            output_ids[:, inputs.input_ids.shape[1]:],
            skip_special_tokens=True,
        )[0]

        cleaned = clean_answer(answer)
        if cleaned:
            return cleaned

    return "\u0442\u043e\u0432\u0430\u0440"


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
    search_query = normalize_query(raw_label)
    listings = listings_for_query(search_query)
    category = category_from_query(search_query)

    print("Vision label:", raw_label)
    print("Prepared listings:", search_query, len(listings))

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
