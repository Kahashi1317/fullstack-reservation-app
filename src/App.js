import React, { useState } from "react";

const API = "http://localhost:5000/api";

function App() {
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    newsletter_signup: false,
  });
  const [createdCustomer, setCreatedCustomer] = useState(null);

  const [timeSlot, setTimeSlot] = useState("");
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState(null);

  const handleCustomerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomer((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const createCustomer = async (e) => {
    e.preventDefault();
    setError(null);
    setReservation(null);

    try {
      const res = await fetch(`${API}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error creating customer");
      } else {
        setCreatedCustomer(data);
      }
    } catch {
      setError("Network error");
    }
  };

  const createReservation = async (e) => {
    e.preventDefault();
    setError(null);

    if (!createdCustomer) {
      setError("Create a customer first");
      return;
    }

    try {
      const res = await fetch(`${API}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: createdCustomer.id,
          time_slot: timeSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error creating reservation");
      } else {
        setReservation(data.reservation);
      }
    } catch {
      setError("Network error");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Reservation Demo</h1>

      <h2>1. Customer</h2>
      <form onSubmit={createCustomer}>
        <div>
          <label>Name:</label>
          <input name="name" value={customer.name} onChange={handleCustomerChange} />
        </div>
        <div>
          <label>Email:</label>
          <input name="email" value={customer.email} onChange={handleCustomerChange} />
        </div>
        <div>
          <label>Phone:</label>
          <input name="phone" value={customer.phone} onChange={handleCustomerChange} />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="newsletter_signup"
              checked={customer.newsletter_signup}
              onChange={handleCustomerChange}
            />
            Newsletter
          </label>
        </div>
        <button type="submit">Create Customer</button>
      </form>

      {createdCustomer && (
        <p>Customer created with ID: {createdCustomer.id}</p>
      )}

      <h2>2. Reservation</h2>
      <form onSubmit={createReservation}>
        <div>
          <label>Time Slot (z.B. 2026-04-01 19:30):</label>
          <input
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
          />
        </div>
        <button type="submit">Reserve Table</button>
      </form>

      {reservation && (
        <div style={{ marginTop: "1rem", color: "green" }}>
          <h3>Reservation OK</h3>
          <pre>{JSON.stringify(reservation, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
