from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

# <<< HIER deine Zugangsdaten anpassen >>>
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:PASSWORT@localhost:5432/reservation_db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# --- Models -------------------------------------------------
class Customer(db.Model):
    __tablename__ = "customers"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    phone = db.Column(db.String(50))
    newsletter_signup = db.Column(db.Boolean, default=False)

class Reservation(db.Model):
    __tablename__ = "reservations"
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    time_slot = db.Column(db.String(50), nullable=False)  # hier einfach als String
    table_number = db.Column(db.Integer, nullable=False)

with app.app_context():
    db.create_all()

TOTAL_TABLES = 30

# --- Endpoints ----------------------------------------------

@app.route("/api/customers", methods=["POST"])
def create_customer():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    newsletter_signup = data.get("newsletter_signup", False)

    if not name or not email:
        return jsonify({"error": "name and email required"}), 400

    existing = Customer.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "email already exists"}), 400

    customer = Customer(
        name=name,
        email=email,
        phone=phone,
        newsletter_signup=bool(newsletter_signup),
    )
    db.session.add(customer)
    db.session.commit()

    return jsonify({"id": customer.id, "name": customer.name}), 201


@app.route("/api/reservations", methods=["POST"])
def create_reservation():
    data = request.get_json()
    customer_id = data.get("customer_id")
    time_slot = data.get("time_slot")

    if not customer_id or not time_slot:
        return jsonify({"error": "customer_id and time_slot required"}), 400

    # Kunde vorhanden?
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "customer not found"}), 404

    # belegte Tische für diesen Slot
    reserved = {
        r.table_number
        for r in Reservation.query.filter_by(time_slot=time_slot).all()
    }
    available = [t for t in range(1, TOTAL_TABLES + 1) if t not in reserved]

    if not available:
        return jsonify({"error": "no tables available"}), 409

    table_number = random.choice(available)

    reservation = Reservation(
        customer_id=customer_id,
        time_slot=time_slot,
        table_number=table_number,
    )
    db.session.add(reservation)
    db.session.commit()

    return jsonify({
        "message": "ok",
        "reservation": {
            "id": reservation.id,
            "customer_id": reservation.customer_id,
            "time_slot": reservation.time_slot,
            "table_number": reservation.table_number,
        }
    }), 201


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)
