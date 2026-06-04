import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict
import asyncio
import logging

logger = logging.getLogger(__name__)


FEEDS = [
    ("CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml"),
    ("Cointelegraph", "https://cointelegraph.com/rss"),
    ("YahooFinance", "https://finance.yahoo.com/rss/")
]


def _extract_text(node, tags):
    for tag in tags:
        el = node.find(tag)
        if el is not None and el.text:
            return el.text
    return ""


async def fetch_feed(client: httpx.AsyncClient, name: str, url: str, timeout: float = 10.0) -> List[Dict]:
    try:
        resp = await client.get(url, timeout=timeout)
        if resp.status_code != 200:
            logger.warning("Feed %s returned status %s", url, resp.status_code)
            return []

        text = resp.text
        # Parse XML safely
        root = ET.fromstring(text)

        items = []

        # RSS channel/item
        for item in root.findall('.//item'):
            title = _extract_text(item, ['title']) or ''
            desc = _extract_text(item, ['description', 'summary']) or ''
            pub = _extract_text(item, ['pubDate', 'published', 'dc:date']) or ''
            items.append({
                'headline': title.strip(),
                'description': desc.strip(),
                'source': name,
                'published_at': pub
            })

        # Atom entries
        if not items:
            for entry in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
                title = _extract_text(entry, ['{http://www.w3.org/2005/Atom}title']) or ''
                desc = _extract_text(entry, ['{http://www.w3.org/2005/Atom}summary', '{http://www.w3.org/2005/Atom}content']) or ''
                pub = _extract_text(entry, ['{http://www.w3.org/2005/Atom}updated', '{http://www.w3.org/2005/Atom}published']) or ''
                items.append({
                    'headline': title.strip(),
                    'description': desc.strip(),
                    'source': name,
                    'published_at': pub
                })

        return items
    except Exception as e:
        logger.exception("Failed to fetch or parse feed %s: %s", url, e)
        return []


async def fetch_market_news(symbol: str = "BTC", limit: int = 10) -> List[Dict]:
    """Fetch market-related news from a few public RSS feeds.

    Returns a list of dicts with headline, description, source, published_at.
    Safe: returns [] on any failure.
    """
    try:
        symbol = (symbol or "").lower()
        # map common symbols to keywords
        symbol_aliases = {
            'btc': ['btc', 'bitcoin'],
            'eth': ['eth', 'ethereum']
        }
        aliases = symbol_aliases.get(symbol.lower(), [symbol.lower()]) if symbol else []

        async with httpx.AsyncClient() as client:
            tasks = [fetch_feed(client, name, url) for name, url in FEEDS]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        collected: List[Dict] = []
        for res in results:
            if isinstance(res, Exception):
                logger.warning("Feed fetch raised: %s", res)
                continue
            for item in res:
                # if symbol provided, prefer items that mention the symbol or its aliases
                text = (item.get('headline', '') + ' ' + item.get('description', '')).lower()
                if aliases:
                    if any(a in text for a in aliases):
                        collected.append(item)
                else:
                    collected.append(item)

                if len(collected) >= limit:
                    break
            if len(collected) >= limit:
                break

        logger.info("Fetched %d news items for %s", len(collected), symbol)
        return collected[:limit]
    except Exception as e:
        logger.exception("Error fetching market news: %s", e)
        return []
