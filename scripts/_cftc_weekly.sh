#!/bin/bash
# Weekly CFTC fetch wrapper — called by Hermes cron job
cd /e/Dralvo/dralvo-landing || exit 1
export DRALVO_API_URL="https://www.dralvo.com/api/cftc-status"
export DRALVO_API_SECRET="dralvo-cftc-live-2026-XAUUSD-9f4b7c2e61a8"
python scripts/fetch_cftc.py
