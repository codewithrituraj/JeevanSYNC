# JeevanSYNC Flask backend

The backend now runs as a Python Flask API with SQLite persistence. It keeps the existing React contract under `/api/v1`.

## Local setup

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API runs at `http://localhost:5050`. The React Vite proxy already forwards `/api` requests there.

The first run creates `jeevansync.db` and seeds demo data. Demo password for the seeded accounts is `Password@123`; see the root README for the demo phone numbers.

Useful checks:

```bash
curl http://localhost:5050/health
```
