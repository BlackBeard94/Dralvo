"""
Dralvo CFTC Fetcher — run weekly (Saturday after CFTC publishes Friday)
Fetches latest CFTC COT report, parses Managed Money net, updates API endpoint.
Usage: python fetch_cftc.py
Requires: DRALVO_API_URL env var (or defaults to localhost)
"""
import csv, json, os, requests
from io import StringIO
from datetime import datetime

CFTC_URL = "https://www.cftc.gov/dea/newcot/f_disagg.txt"
GOLD_CODE = "088691"
API_URL = os.environ.get("DRALVO_API_URL", "https://www.dralvo.com/api/cftc-status")
API_SECRET = os.environ.get("DRALVO_API_SECRET", "")

def fetch_cftc():
    """Fetch and parse CFTC Disaggregated Futures-Only report."""
    print(f"Fetching {CFTC_URL}...")
    resp = requests.get(CFTC_URL, timeout=30)
    resp.raise_for_status()
    
    reader = csv.reader(StringIO(resp.text))
    for row in reader:
        if len(row) < 20:
            continue
        if row[3].strip() != GOLD_CODE:
            continue
        
        report_date = row[2].strip()
        managed_money_long = int(row[13])
        managed_money_short = int(row[14])
        mm_net = managed_money_long - managed_money_short
        
        bullish = mm_net > 100_000
        
        print(f"  Gold COMEX found!")
        print(f"  Report date: {report_date}")
        print(f"  Managed Money net: {mm_net:,}")
        print(f"  Bullish (>100K): {bullish}")
        
        return {
            "bullish": bullish,
            "mm_net": mm_net,
            "updated": report_date,
        }
    
    raise Exception("Gold COMEX contract 088691 not found in CFTC report")

def update_api(data):
    """POST the CFTC status to the Dralvo API."""
    headers = {"Content-Type": "application/json"}
    if API_SECRET:
        headers["Authorization"] = f"Bearer {API_SECRET}"
    
    print(f"\nUpdating {API_URL}...")
    resp = requests.post(API_URL, json=data, headers=headers, timeout=30)
    resp.raise_for_status()
    print(f"  Response: {resp.json()}")

if __name__ == "__main__":
    print("=" * 50)
    print("  DRALVO CFTC FETCHER")
    print(f"  {datetime.now().isoformat()}")
    print("=" * 50)
    
    try:
        data = fetch_cftc()
        update_api(data)
        print("\n✅ CFTC status updated successfully!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        exit(1)
