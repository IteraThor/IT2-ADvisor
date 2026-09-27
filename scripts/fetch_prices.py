"""
fetch_prices.py  -  AliExpress price sync for IT2 BOM Configurator
Clicks the correct SKU variant and reads the updated price from the DOM.
Also fetches live EUR/USD/GBP rates from frankfurter.app.

Usage:
    python scripts/fetch_prices.py
"""

import json, re, asyncio, pathlib, urllib.request
from datetime import datetime, timezone
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).parent.parent
COMPONENTS = ROOT / "knowledge" / "components.json"
PRICES_OUT  = ROOT / "knowledge" / "prices.json"

PRICE_CLASS_PATTERNS = [
    "[class*='price--current']",
    "[class*='price-default--current']",
    "[class*='currentPriceText']",
]

def fetch_fx_rates():
    apis = [
        "https://open.er-api.com/v6/latest/EUR",
        "https://api.exchangerate-api.com/v4/latest/EUR",
    ]
    for url in apis:
        try:
            with urllib.request.urlopen(url, timeout=10) as r:
                data = json.loads(r.read())
                rates = data.get("rates", {})
                usd = rates.get("USD") or rates.get("usd")
                gbp = rates.get("GBP") or rates.get("gbp")
                if usd and gbp:
                    result = {"USD": round(usd, 4), "GBP": round(gbp, 4)}
                    print(f"FX rates: 1 EUR = {result['USD']} USD, {result['GBP']} GBP")
                    return result
        except Exception as e:
            print(f"FX API {url} failed: {e}")
    print("All FX APIs failed, using fallback rates")
    return {"USD": 1.08, "GBP": 0.85}

def load_targets():
    data = json.loads(COMPONENTS.read_text(encoding="utf-8"))
    targets = {}
    for comp in data["components"]:
        for hw in comp.get("hardware", []):
            if "price_key" in hw and "url" in hw:
                key = hw["price_key"]
                if key not in targets:
                    targets[key] = {
                        "url": hw["url"],
                        "sku_col": hw.get("sku_col"),
                        "name": hw["name"],
                    }
    return targets

async def fetch_price_eur(page, url: str, sku_col: str = None) -> float | None:
    await page.goto(url, wait_until="networkidle", timeout=45000)
    await page.wait_for_timeout(2000)

    if sku_col:
        el = await page.query_selector(f'[data-sku-col="{sku_col}"]')
        if el:
            await el.click()
            await page.wait_for_timeout(2500)
        else:
            print(f"  WARNING: sku_col {sku_col!r} not found on page")

    result = await page.evaluate("""(patterns) => {
        for (const sel of patterns) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                const t = el.innerText.trim();
                if (t && /[0-9]/.test(t)) return t;
            }
        }
        return null;
    }""", PRICE_CLASS_PATTERNS)

    if result:
        nums = re.findall(r'[0-9]+[.,][0-9]{2}', result.replace('\xa0', ''))
        if nums:
            return float(nums[0].replace(',', '.'))

    return None

async def run():
    targets = load_targets()
    if not targets:
        print("No price targets found in components.json")
        return

    fx = fetch_fx_rates()

    prices = {}
    if PRICES_OUT.exists():
        try:
            existing = json.loads(PRICES_OUT.read_text(encoding="utf-8"))
            prices = {k: v for k, v in existing.items() if not k.startswith("_")}
        except Exception:
            pass

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            viewport={"width": 1280, "height": 800},
        )

        for key, info in targets.items():
            sku_label = f" [sku_col={info['sku_col']}]" if info.get("sku_col") else ""
            print(f"\nFetching: {info['name']}{sku_label} ...")
            page = await context.new_page()
            try:
                eur = await fetch_price_eur(page, info["url"], info.get("sku_col"))
                if eur is not None:
                    usd = round(eur * fx.get("USD", 1.08), 2)
                    gbp = round(eur * fx.get("GBP", 0.85), 2)
                    prices[key] = {
                        "eur": eur,
                        "usd": usd,
                        "gbp": gbp,
                        "name": info["name"],
                        "url": info["url"],
                    }
                    print(f"  -> EUR {eur:.2f}  |  USD {usd:.2f}  |  GBP {gbp:.2f}")
                else:
                    print(f"  -> Could not extract price")
            except Exception as e:
                print(f"  -> Error: {e}")
            finally:
                await page.close()

        await browser.close()

    prices["_updated"] = datetime.now(timezone.utc).isoformat()
    prices["_fx_rates"] = fx
    PRICES_OUT.write_text(
        json.dumps(prices, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\nSaved -> {PRICES_OUT}")

if __name__ == "__main__":
    asyncio.run(run())
