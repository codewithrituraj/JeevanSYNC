"""JeevanSYNC Flask API.

This service keeps the original React API contract while replacing the
Express/Prisma backend with Flask and a small SQLite persistence layer.
Run with: python app.py
"""
from __future__ import annotations

import hashlib
import json
import os
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps
from math import asin, cos, radians, sin, sqrt

import jwt
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.getenv("DATABASE_PATH", os.path.join(BASE_DIR, "jeevansync.db"))
PORT = int(os.getenv("PORT", "5050"))
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:3000")
JWT_SECRET = os.getenv("JWT_ACCESS_SECRET", "dev_jwt_access_secret_min_32_characters_long_12345")

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=[CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"])


def now():
    return datetime.now(timezone.utc).isoformat()


def uid():
    return str(uuid.uuid4())


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_error=None):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def rows(sql, params=()):
    return [dict(row) for row in db().execute(sql, params).fetchall()]


def row(sql, params=()):
    result = db().execute(sql, params).fetchone()
    return dict(result) if result else None


def execute(sql, params=()):
    connection = db()
    cursor = connection.execute(sql, params)
    connection.commit()
    return cursor


def ok(data=None, status=200):
    return jsonify({"success": True, "data": data}), status


def fail(message, status=400, code="BAD_REQUEST"):
    return jsonify({"success": False, "data": None, "error": {"message": message, "code": code}}), status


def body():
    return request.get_json(silent=True) or {}


def token_for(user_id):
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(minutes=30)}, JWT_SECRET, algorithm="HS256")


def current_user(required=True):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None if not required else (fail("Authentication required", 401, "UNAUTHENTICATED"))
    try:
        payload = jwt.decode(header[7:], JWT_SECRET, algorithms=["HS256"])
        user = row("SELECT id, email, phone, name, role, hospital_id AS hospitalId FROM users WHERE id = ?", (payload["sub"],))
        if not user:
            raise jwt.InvalidTokenError()
        return user
    except jwt.PyJWTError:
        return None if not required else (fail("Invalid or expired token", 401, "UNAUTHENTICATED"))


def auth_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not isinstance(user, dict):
            return user
        g.user = user
        return handler(*args, **kwargs)
    return wrapper


def optional_user():
    user = current_user(required=False)
    return user if isinstance(user, dict) else None


def role_required(*roles):
    def decorator(handler):
        @wraps(handler)
        @auth_required
        def wrapper(*args, **kwargs):
            if g.user["role"] != "SUPER_ADMIN" and g.user["role"] not in roles:
                return fail("You do not have permission for this action", 403, "FORBIDDEN")
            return handler(*args, **kwargs)
        return wrapper
    return decorator


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, phone TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'PATIENT', hospital_id TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS hospitals (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL, state TEXT, pincode TEXT, latitude REAL, longitude REAL, contact_phone TEXT, emergency_contact TEXT, is_verified INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS doctors (id TEXT PRIMARY KEY, user_id TEXT, hospital_id TEXT NOT NULL, name TEXT NOT NULL, specialty TEXT NOT NULL, qualification TEXT, experience_years INTEGER DEFAULT 0, consultation_fee REAL DEFAULT 0, is_active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS appointments (id TEXT PRIMARY KEY, patient_id TEXT, doctor_id TEXT NOT NULL, hospital_id TEXT NOT NULL, slot_time TEXT NOT NULL, notes TEXT, status TEXT DEFAULT 'BOOKED', source TEXT DEFAULT 'WEB', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS beds (id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, ward_type TEXT NOT NULL, total INTEGER NOT NULL, available INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS blood_inventory (id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, blood_group TEXT NOT NULL, units INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS diagnostics (id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL, turnaround_hours REAL NOT NULL, sample_type TEXT, fasting_required INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS medicines (id TEXT PRIMARY KEY, hospital_id TEXT NOT NULL, name TEXT NOT NULL, generic_name TEXT, stock INTEGER DEFAULT 0, price REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS insurance_providers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, website TEXT);
CREATE TABLE IF NOT EXISTS insurance_links (id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, hospital_id TEXT NOT NULL, cashless INTEGER DEFAULT 1, tpa_desk TEXT);
CREATE TABLE IF NOT EXISTS ambulances (id TEXT PRIMARY KEY, patient_id TEXT, reason TEXT, pickup_address TEXT, latitude REAL, longitude REAL, status TEXT DEFAULT 'REQUESTED', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS referrals (id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, from_hospital_id TEXT, to_hospital_id TEXT, reason TEXT, priority TEXT DEFAULT 'NORMAL', status TEXT DEFAULT 'PENDING', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS patient_history (id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, doctor_id TEXT, diagnosis TEXT, notes TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, remind_at TEXT NOT NULL, status TEXT DEFAULT 'PENDING', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, user_id TEXT, role TEXT NOT NULL, message TEXT NOT NULL, urgency TEXT, created_at TEXT NOT NULL);
"""


def init_db():
    connection = sqlite3.connect(DATABASE)
    connection.executescript(SCHEMA)
    connection.commit()
    connection.close()
    with app.app_context():
        if row("SELECT id FROM hospitals LIMIT 1"):
            return
        h1, h2, h3 = uid(), uid(), uid()
        execute("INSERT INTO hospitals VALUES (?,?,?,?,?,?,?,?,?,?,?)", (h1, "Max Super Speciality Hospital", "Press Enclave Road, Saket", "New Delhi", "Delhi", "110017", 28.5276, 77.2183, "011-2651-5050", "011-2651-5051", 1))
        execute("INSERT INTO hospitals VALUES (?,?,?,?,?,?,?,?,?,?,?)", (h2, "Apollo Hospitals Indraprastha", "Mathura Road, Sarita Vihar", "New Delhi", "Delhi", "110076", 28.5355, 77.2880, "011-2692-5858", "011-2692-5859", 1))
        execute("INSERT INTO hospitals VALUES (?,?,?,?,?,?,?,?,?,?,?)", (h3, "Fortis Memorial Research Institute", "Sector 44", "Gurugram", "Haryana", "122002", 28.4595, 77.0266, "0124-496-2200", "0124-496-2201", 1))
        users = [
            ("9811223344", "Rohan Mehra", "PATIENT", None, "rohan@example.com"),
            ("9876543213", "Dr. Ananya Sen", "DOCTOR", h1, "ananya@example.com"),
            ("9876543211", "Vikram Malhotra", "HOSPITAL_ADMIN", h1, "vikram@example.com"),
            ("9876543212", "Pooja Sharma", "RECEPTION_STAFF", h2, "pooja@example.com"),
            ("9876543210", "Dr. Rajesh Verma", "SUPER_ADMIN", h1, "rajesh@example.com"),
        ]
        user_ids = {}
        for phone, name, role, hospital_id, email in users:
            user_id = uid(); user_ids[phone] = user_id
            execute("INSERT INTO users VALUES (?,?,?,?,?,?,?,?)", (user_id, email, phone, generate_password_hash("Password@123"), name, role, hospital_id, now()))
        execute("INSERT INTO doctors VALUES (?,?,?,?,?,?,?,?,?)", (uid(), user_ids["9876543213"], h1, "Dr. Ananya Sen", "Cardiology", "MD, DM Cardiology", 12, 1200, 1))
        doctor2 = uid(); doctor3 = uid()
        execute("INSERT INTO doctors VALUES (?,?,?,?,?,?,?,?,?)", (doctor2, None, h2, "Dr. Arjun Kapoor", "Neurology", "MD, DM Neurology", 15, 1500, 1))
        execute("INSERT INTO doctors VALUES (?,?,?,?,?,?,?,?,?)", (doctor3, None, h3, "Dr. Meera Iyer", "General Medicine", "MBBS, MD", 9, 800, 1))
        for hospital_id in (h1, h2, h3):
            for ward, total, available in (("ICU", 20, 4), ("HDU", 15, 6), ("EMERGENCY", 25, 8), ("GENERAL", 80, 31), ("NICU", 12, 3), ("PEDIATRIC", 20, 7)):
                execute("INSERT INTO beds VALUES (?,?,?,?,?,?)", (uid(), hospital_id, ward, total, available, now()))
        groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        for hospital_id in (h1, h2, h3):
            for group in groups:
                execute("INSERT INTO blood_inventory VALUES (?,?,?,?,?)", (uid(), hospital_id, group, 15 if group in ("O+", "A+") else 6, now()))
        tests = [("Complete Blood Count", "Hematology", 450, 6, "Blood", 0), ("Lipid Profile", "Biochemistry", 800, 8, "Blood", 10), ("MRI Brain", "Imaging", 5500, 24, "None", 0), ("Thyroid Profile", "Hormones", 900, 10, "Blood", 0)]
        for hospital_id in (h1, h2, h3):
            for name, category, price, hours, sample, fasting in tests:
                execute("INSERT INTO diagnostics VALUES (?,?,?,?,?,?,?,?)", (uid(), hospital_id, name, category, price, hours, sample, fasting))
        medicines = [("Paracetamol 500mg", "Paracetamol", 120, 2.5), ("Amoxicillin 500mg", "Amoxicillin", 40, 8.0), ("Atorvastatin 10mg", "Atorvastatin", 75, 12.0), ("Azithromycin 500mg", "Azithromycin", 50, 10.0)]
        for name, generic, stock, price in medicines:
            execute("INSERT INTO medicines VALUES (?,?,?,?,?,?)", (uid(), h1, name, generic, stock, price))
        for name in ("Star Health", "HDFC ERGO", "ICICI Lombard", "Niva Bupa"):
            provider = uid(); execute("INSERT INTO insurance_providers VALUES (?,?,?,?)", (provider, name, "1800-123-4567", "https://example.com"))
            for hospital_id in (h1, h2, h3):
                execute("INSERT INTO insurance_links VALUES (?,?,?,?,?)", (uid(), provider, hospital_id, 1, "Ground Floor TPA Desk"))


@app.get("/health")
def health():
    return ok({"status": "healthy", "service": "JeevanSYNC Flask API", "version": "2.0.0", "timestamp": now()})


@app.post("/api/v1/auth/login")
def login():
    data = body(); identifier = str(data.get("identifier", "")).strip(); password = data.get("password", "")
    user = row("SELECT * FROM users WHERE phone = ? OR email = ?", (identifier, identifier))
    if not user or not check_password_hash(user["password_hash"], password):
        return fail("Invalid credentials", 401, "INVALID_CREDENTIALS")
    public = {"id": user["id"], "name": user["name"], "phone": user["phone"], "email": user["email"], "role": user["role"], "hospitalId": user["hospital_id"]}
    response, status = ok({"user": public, "accessToken": token_for(user["id"]), "refreshToken": secrets.token_urlsafe(32)})
    response.set_cookie("jeevansync_refresh", token_for(user["id"]), httponly=True, samesite="Lax", max_age=604800)
    return response, status


@app.post("/api/v1/auth/register")
def register():
    data = body(); phone = str(data.get("phone", "")).strip(); name = str(data.get("name", "")).strip(); password = data.get("password", "")
    if not phone or not name or len(password) < 8:
        return fail("Name, phone and a password of at least 8 characters are required")
    if row("SELECT id FROM users WHERE phone = ?", (phone,)):
        return fail("Phone number is already registered", 409, "DUPLICATE_PHONE")
    user_id = uid(); execute("INSERT INTO users VALUES (?,?,?,?,?,?,?,?)", (user_id, data.get("email"), phone, generate_password_hash(password), name, "PATIENT", None, now()))
    public = {"id": user_id, "name": name, "phone": phone, "email": data.get("email"), "role": "PATIENT", "hospitalId": None}
    return ok({"user": public, "accessToken": token_for(user_id), "refreshToken": secrets.token_urlsafe(32)}, 201)


@app.post("/api/v1/auth/refresh")
def refresh():
    token = request.cookies.get("jeevansync_refresh")
    if not token:
        return fail("Refresh token required", 401, "UNAUTHENTICATED")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not row("SELECT id FROM users WHERE id = ?", (payload["sub"],)):
            raise jwt.InvalidTokenError()
        return ok({"accessToken": token_for(payload["sub"])})
    except jwt.PyJWTError:
        return fail("Invalid refresh token", 401, "UNAUTHENTICATED")


@app.post("/api/v1/auth/logout")
@auth_required
def logout():
    response, status = ok({"loggedOut": True}); response.delete_cookie("jeevansync_refresh"); return response, status


@app.get("/api/v1/auth/me")
@auth_required
def me():
    return ok(g.user)


def hospital_query():
    result = rows("SELECT id, name, address, city, state, pincode, latitude, longitude, contact_phone AS contactPhone, emergency_contact AS emergencyContact, is_verified AS isVerified FROM hospitals ORDER BY name")
    for item in result: item["isVerified"] = bool(item["isVerified"])
    return result


@app.get("/api/v1/reception/hospitals")
def hospitals(): return ok(hospital_query())


@app.get("/api/v1/reception/hospitals/<hospital_id>")
def hospital_detail(hospital_id):
    item = next((hospital for hospital in hospital_query() if hospital["id"] == hospital_id), None)
    return ok(item) if item else fail("Hospital not found", 404, "NOT_FOUND")


@app.get("/api/v1/reception/hospitals/nearby")
def nearby_hospitals():
    lat, lng, radius = float(request.args.get("lat", 28.6139)), float(request.args.get("lng", 77.2090)), float(request.args.get("radiusKm", 50))
    result = []
    for item in hospital_query():
        distance = 6371 * 2 * asin(sqrt(sin(radians(item["latitude"] - lat) / 2) ** 2 + cos(radians(lat)) * cos(radians(item["latitude"])) * sin(radians(item["longitude"] - lng) / 2) ** 2))
        if distance <= radius: item["distanceKm"] = round(distance, 2); result.append(item)
    return ok(sorted(result, key=lambda x: x["distanceKm"]))


@app.get("/api/v1/reception/doctors")
def doctors():
    query = "SELECT d.id, d.hospital_id AS hospitalId, d.name, d.specialty, d.qualification, d.experience_years AS experienceYears, d.consultation_fee AS consultationFee, h.name AS hospitalName, h.city FROM doctors d JOIN hospitals h ON h.id=d.hospital_id WHERE d.is_active=1"
    params = []
    if request.args.get("specialty"): query += " AND lower(d.specialty)=lower(?)"; params.append(request.args["specialty"])
    if request.args.get("city"): query += " AND lower(h.city) LIKE lower(?)"; params.append(f"%{request.args['city']}%")
    return ok(rows(query + " ORDER BY d.name", params))


@app.get("/api/v1/reception/doctors/<doctor_id>/slots")
def slots(doctor_id):
    date = request.args.get("date", datetime.now().date().isoformat())
    taken = {item["slot_time"][:16] for item in rows("SELECT slot_time FROM appointments WHERE doctor_id=? AND slot_time LIKE ? AND status='BOOKED'", (doctor_id, f"{date}%"))}
    return ok([{"time": f"{hour:02d}:{minute:02d}", "available": f"{date}T{hour:02d}:{minute:02d}"[:16] not in taken} for hour in (9, 10, 11, 14, 15, 16) for minute in (0, 30) if f"{hour:02d}:{minute:02d}" not in taken])


@app.post("/api/v1/reception/appointments/book")
def book_appointment():
    data = body(); user = optional_user(); patient_id = user["id"] if user else None
    doctor = row("SELECT id, hospital_id FROM doctors WHERE id=? AND is_active=1", (data.get("doctorId"),))
    if not doctor: return fail("Doctor not found", 404, "NOT_FOUND")
    if row("SELECT id FROM appointments WHERE doctor_id=? AND slot_time=? AND status='BOOKED'", (doctor["id"], data.get("slotTime"))): return fail("This slot has already been booked", 409, "SLOT_TAKEN")
    appointment_id = uid(); execute("INSERT INTO appointments VALUES (?,?,?,?,?,?,?,?,?)", (appointment_id, patient_id, doctor["id"], doctor["hospital_id"], data.get("slotTime"), data.get("notes", ""), "BOOKED", data.get("source", "WEB"), now()))
    return ok({"id": appointment_id, "status": "BOOKED", "slotTime": data.get("slotTime"), "doctorId": doctor["id"]}, 201)


@app.get("/api/v1/reception/appointments/my")
@auth_required
def my_appointments():
    return ok(rows("SELECT a.id, a.slot_time AS slotTime, a.status, a.notes, d.name AS doctorName, d.specialty, h.name AS hospitalName, h.address FROM appointments a JOIN doctors d ON d.id=a.doctor_id JOIN hospitals h ON h.id=a.hospital_id WHERE a.patient_id=? ORDER BY a.slot_time", (g.user["id"],)))


@app.get("/api/v1/coordination/beds")
def beds():
    query = "SELECT b.id, b.ward_type AS wardType, b.total, b.available, h.id AS hospitalId, h.name AS hospitalName, h.city, h.address FROM beds b JOIN hospitals h ON h.id=b.hospital_id WHERE 1=1"; params=[]
    if request.args.get("wardType"): query += " AND b.ward_type=?"; params.append(request.args["wardType"])
    if request.args.get("city"): query += " AND lower(h.city) LIKE lower(?)"; params.append(f"%{request.args['city']}%")
    return ok(rows(query + " ORDER BY h.name, b.ward_type", params))


@app.post("/api/v1/coordination/beds/update")
@role_required("HOSPITAL_ADMIN", "RECEPTION_STAFF")
def update_beds():
    data = body(); hospital_id = data.get("hospitalId") or g.user["hospitalId"]
    existing = row("SELECT id FROM beds WHERE hospital_id=? AND ward_type=?", (hospital_id, data.get("wardType")))
    values = (int(data.get("total", 0)), int(data.get("available", 0)), now())
    if existing:
        execute("UPDATE beds SET total=?, available=?, updated_at=? WHERE id=?", (*values, existing["id"]))
    else:
        execute("INSERT INTO beds VALUES (?,?,?,?,?,?)", (uid(), hospital_id, data.get("wardType"), *values))
    return ok({"updated": True})


@app.post("/api/v1/coordination/ambulance/request")
def ambulance_request():
    data = body(); user = optional_user(); item_id = uid(); execute("INSERT INTO ambulances VALUES (?,?,?,?,?,?,?,?)", (item_id, user["id"] if user else None, data.get("reason", "Emergency assistance required"), data.get("pickupAddress", "Current location"), data.get("latitude"), data.get("longitude"), "REQUESTED", now()))
    return ok({"id": item_id, "status": "REQUESTED", "message": "Ambulance request received. Emergency coordination team notified."}, 201)


@app.get("/api/v1/coordination/ambulance/requests")
@auth_required
def ambulance_requests(): return ok(rows("SELECT id, reason, pickup_address AS pickupAddress, latitude, longitude, status, created_at AS createdAt FROM ambulances WHERE patient_id=? OR ? IN ('HOSPITAL_ADMIN','RECEPTION_STAFF','SUPER_ADMIN') ORDER BY created_at DESC", (g.user["id"], g.user["role"])))


@app.patch("/api/v1/coordination/ambulance/<item_id>/status")
@role_required("HOSPITAL_ADMIN", "RECEPTION_STAFF")
def ambulance_status(item_id):
    status = body().get("status", "REQUESTED"); execute("UPDATE ambulances SET status=? WHERE id=?", (status, item_id)); return ok({"id": item_id, "status": status})


@app.get("/api/v1/bloodbank/availability")
def blood_availability():
    query = "SELECT b.id, b.blood_group AS bloodGroup, b.units, h.id AS hospitalId, h.name AS hospitalName, h.city, h.address, h.contact_phone AS contactPhone FROM blood_inventory b JOIN hospitals h ON h.id=b.hospital_id WHERE b.units > 0"; params=[]
    if request.args.get("bloodGroup"): query += " AND b.blood_group=?"; params.append(request.args["bloodGroup"])
    if request.args.get("city"): query += " AND lower(h.city) LIKE lower(?)"; params.append(f"%{request.args['city']}%")
    return ok(rows(query + " ORDER BY b.units DESC", params))


@app.post("/api/v1/bloodbank/update")
@role_required("HOSPITAL_ADMIN", "RECEPTION_STAFF")
def blood_update():
    data = body(); item = row("SELECT id FROM blood_inventory WHERE hospital_id=? AND blood_group=?", (data.get("hospitalId") or g.user["hospitalId"], data.get("bloodGroup")))
    if item: execute("UPDATE blood_inventory SET units=?, updated_at=? WHERE id=?", (int(data.get("units", 0)), now(), item["id"]))
    else: execute("INSERT INTO blood_inventory VALUES (?,?,?,?,?)", (uid(), data.get("hospitalId") or g.user["hospitalId"], data.get("bloodGroup"), int(data.get("units", 0)), now()))
    return ok({"updated": True})


@app.get("/api/v1/diagnostics/categories")
def diagnostic_categories(): return ok([item["category"] for item in rows("SELECT DISTINCT category FROM diagnostics ORDER BY category")])


@app.get("/api/v1/diagnostics/search")
def diagnostic_search():
    query = "SELECT d.id, d.name, d.category, d.price, d.turnaround_hours AS turnaroundHours, d.sample_type AS sampleType, d.fasting_required AS fastingRequired, h.name AS hospitalName, h.city FROM diagnostics d JOIN hospitals h ON h.id=d.hospital_id WHERE 1=1"; params=[]
    if request.args.get("query"): query += " AND lower(d.name) LIKE lower(?)"; params.append(f"%{request.args['query']}%")
    if request.args.get("category"): query += " AND d.category=?"; params.append(request.args["category"])
    return ok(rows(query + " ORDER BY d.price", params))


@app.get("/api/v1/diagnostics/compare")
def diagnostic_compare():
    name = request.args.get("name", "")
    return ok(rows("SELECT d.name, d.price, d.turnaround_hours AS turnaroundHours, h.name AS hospitalName, h.city FROM diagnostics d JOIN hospitals h ON h.id=d.hospital_id WHERE lower(d.name) LIKE lower(?) ORDER BY d.price", (f"%{name}%",)))


@app.post("/api/v1/diagnostics")
@role_required("HOSPITAL_ADMIN")
def create_diagnostic():
    data = body(); item_id = uid(); execute("INSERT INTO diagnostics VALUES (?,?,?,?,?,?,?,?,?)", (item_id, data.get("hospitalId") or g.user["hospitalId"], data.get("name"), data.get("category", "Other"), float(data.get("price", 0)), float(data.get("turnaroundHours", 24)), data.get("sampleType", "Blood"), int(bool(data.get("fastingRequired", False))))); return ok({"id": item_id, **data}, 201)


@app.get("/api/v1/inventory/search")
def inventory_search():
    query = request.args.get("query", ""); return ok(rows("SELECT m.id, m.name, m.generic_name AS genericName, m.stock, m.price, h.name AS hospitalName, h.city FROM medicines m JOIN hospitals h ON h.id=m.hospital_id WHERE lower(m.name) LIKE lower(?) OR lower(coalesce(m.generic_name,'')) LIKE lower(?) ORDER BY m.stock DESC", (f"%{query}%", f"%{query}%")))


@app.get("/api/v1/inventory/<item_id>")
def medicine_detail(item_id):
    item = row("SELECT id, name, generic_name AS genericName, stock, price, hospital_id AS hospitalId FROM medicines WHERE id=?", (item_id,))
    return ok(item) if item else fail("Medicine not found", 404, "NOT_FOUND")


@app.post("/api/v1/inventory")
@role_required("HOSPITAL_ADMIN")
def create_medicine():
    data = body(); item_id = uid(); execute("INSERT INTO medicines VALUES (?,?,?,?,?,?)", (item_id, data.get("hospitalId") or g.user["hospitalId"], data.get("name"), data.get("genericName"), int(data.get("stock", 0)), float(data.get("price", 0)))); return ok({"id": item_id, **data}, 201)


@app.patch("/api/v1/inventory/<item_id>/stock")
@role_required("HOSPITAL_ADMIN")
def update_medicine_stock(item_id):
    stock = int(body().get("stock", 0)); execute("UPDATE medicines SET stock=? WHERE id=?", (stock, item_id)); return ok({"id": item_id, "stock": stock})


@app.get("/api/v1/insurance/providers")
def providers(): return ok(rows("SELECT id, name, phone, website FROM insurance_providers ORDER BY name"))


@app.get("/api/v1/insurance/check")
def insurance_check():
    provider = request.args.get("providerId") or request.args.get("provider"); hospital_id = request.args.get("hospitalId")
    query = "SELECT p.name AS providerName, h.name AS hospitalName, h.city, l.cashless, l.tpa_desk AS tpaDesk FROM insurance_links l JOIN insurance_providers p ON p.id=l.provider_id JOIN hospitals h ON h.id=l.hospital_id WHERE l.cashless=1"; params=[]
    if provider: query += " AND (p.id=? OR lower(p.name) LIKE lower(?))"; params.extend([provider, f"%{provider}%"])
    if hospital_id: query += " AND h.id=?"; params.append(hospital_id)
    return ok(rows(query, params))


@app.get("/api/v1/referrals/my")
@auth_required
def referrals(): return ok(rows("SELECT r.id, r.reason, r.priority, r.status, r.created_at AS createdAt, hf.name AS fromHospital, ht.name AS toHospital FROM referrals r LEFT JOIN hospitals hf ON hf.id=r.from_hospital_id LEFT JOIN hospitals ht ON ht.id=r.to_hospital_id WHERE r.patient_id=? ORDER BY r.created_at DESC", (g.user["id"],)))


@app.post("/api/v1/referrals")
@role_required("DOCTOR", "HOSPITAL_ADMIN", "SUPER_ADMIN")
def create_referral():
    data = body(); item_id = uid(); patient_id = data.get("patientId")
    execute("INSERT INTO referrals VALUES (?,?,?,?,?,?,?,?,?)", (item_id, patient_id, data.get("fromHospitalId") or g.user["hospitalId"], data.get("toHospitalId"), data.get("reason", "Patient transfer requested"), data.get("priority", "NORMAL"), "PENDING", now()))
    return ok({"id": item_id, "status": "PENDING"}, 201)


@app.patch("/api/v1/referrals/<item_id>/status")
@role_required("DOCTOR", "HOSPITAL_ADMIN", "RECEPTION_STAFF")
def update_referral(item_id):
    status = body().get("status", "PENDING"); execute("UPDATE referrals SET status=? WHERE id=?", (status, item_id)); return ok({"id": item_id, "status": status})


@app.get("/api/v1/patient-history/my-history")
@auth_required
def history(): return ok(rows("SELECT ph.id, ph.diagnosis, ph.notes, ph.created_at AS createdAt, d.name AS doctorName, h.name AS hospitalName FROM patient_history ph LEFT JOIN doctors d ON d.id=ph.doctor_id LEFT JOIN hospitals h ON h.id=d.hospital_id WHERE ph.patient_id=? ORDER BY ph.created_at DESC", (g.user["id"],)))


@app.get("/api/v1/patient-history/patient/<patient_id>")
@auth_required
def patient_history(patient_id):
    if g.user["id"] != patient_id and g.user["role"] == "PATIENT": return fail("You do not have permission for this action", 403, "FORBIDDEN")
    return ok(rows("SELECT ph.id, ph.diagnosis, ph.notes, ph.created_at AS createdAt, d.name AS doctorName, h.name AS hospitalName FROM patient_history ph LEFT JOIN doctors d ON d.id=ph.doctor_id LEFT JOIN hospitals h ON h.id=d.hospital_id WHERE ph.patient_id=? ORDER BY ph.created_at DESC", (patient_id,)))


@app.post("/api/v1/patient-history")
@role_required("DOCTOR", "HOSPITAL_ADMIN")
def create_history():
    data = body(); item_id = uid(); execute("INSERT INTO patient_history VALUES (?,?,?,?,?,?)", (item_id, data.get("patientId"), data.get("doctorId"), data.get("diagnosis", ""), data.get("notes", ""), now())); return ok({"id": item_id, "createdAt": now()}, 201)


@app.get("/api/v1/reminders/my-reminders")
@auth_required
def reminders(): return ok(rows("SELECT id, title, description, remind_at AS remindAt, status, created_at AS createdAt FROM reminders WHERE user_id=? ORDER BY remind_at", (g.user["id"],)))


@app.post("/api/v1/reminders")
@auth_required
def create_reminder():
    data = body(); item_id = uid(); execute("INSERT INTO reminders VALUES (?,?,?,?,?,?,?)", (item_id, g.user["id"], data.get("title", "Reminder"), data.get("description", ""), data.get("remindAt") or data.get("scheduledFor") or now(), "PENDING", now())); return ok({"id": item_id, **data, "status": "PENDING"}, 201)


@app.delete("/api/v1/reminders/<item_id>")
@auth_required
def delete_reminder(item_id): execute("DELETE FROM reminders WHERE id=? AND user_id=?", (item_id, g.user["id"])); return ok({"deleted": True})


@app.patch("/api/v1/reminders/<item_id>/status")
@auth_required
def reminder_status(item_id):
    status = body().get("status", "SENT"); execute("UPDATE reminders SET status=? WHERE id=? AND user_id=?", (status, item_id, g.user["id"])); return ok({"id": item_id, "status": status})


@app.get("/api/v1/monika-ai/history/<session_id>")
def ai_history(session_id): return ok(rows("SELECT role, message, urgency, created_at AS createdAt FROM conversations WHERE session_id=? ORDER BY created_at", (session_id,)))


@app.post("/api/v1/monika-ai/chat")
def ai_chat():
    data = body(); message = data.get("message") or data.get("content") or ""; session_id = data.get("sessionId") or uid(); user = optional_user()
    lower = message.lower(); red_flags = any(word in lower for word in ("chest pain", "difficulty breathing", "unconscious", "stroke", "severe bleeding")); urgency = "EMERGENCY" if red_flags else ("URGENT" if any(word in lower for word in ("fever", "pain", "vomit")) else "ROUTINE")
    reply = ("This may be an emergency. Call 112 immediately or use 1-Tap Ambulance. Do not drive yourself." if urgency == "EMERGENCY" else "I can provide general health guidance, but I cannot diagnose or prescribe. Please consult a qualified clinician, especially if symptoms worsen.")
    execute("INSERT INTO conversations VALUES (?,?,?,?,?,?,?)", (uid(), session_id, user["id"] if user else None, "user", message, urgency, now())); execute("INSERT INTO conversations VALUES (?,?,?,?,?,?,?)", (uid(), session_id, user["id"] if user else None, "assistant", reply, urgency, now()))
    return ok({"sessionId": session_id, "message": reply, "response": reply, "urgency": urgency, "disclaimer": "This is general information, not a medical diagnosis."})


@app.route("/api/v1/whatsapp/webhook", methods=["GET", "POST"])
def whatsapp_webhook():
    if request.method == "GET":
        if request.args.get("hub.verify_token") == os.getenv("WHATSAPP_VERIFY_TOKEN", "jeevansync_whatsapp_verify_token_2026"): return request.args.get("hub.challenge", "")
        return fail("Verification failed", 403)
    return ok({"received": True})


@app.errorhandler(404)
def not_found(_error): return fail("Route not found", 404, "ROUTE_NOT_FOUND")


@app.errorhandler(Exception)
def handle_error(error):
    app.logger.exception(error)
    return fail("Internal server error", 500, "INTERNAL_ERROR")


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=os.getenv("FLASK_DEBUG", "1") == "1")
