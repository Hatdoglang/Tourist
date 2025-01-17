from flask import Flask, request, session, redirect, url_for, jsonify, render_template
import firebase_admin
from firebase_admin import credentials, auth
import os
import json
from flask_cors import CORS

# Get Firebase credentials from environment variables
firebase_service_account = os.getenv('FIREBASE_SERVICE_ACCOUNT')
firebase_database_url = os.getenv('FIREBASE_DATABASE_URL')

if not firebase_service_account or not firebase_database_url:
    raise EnvironmentError("Environment variables for Firebase are not set correctly.")

# Initialize Firebase Admin SDK
cred = credentials.Certificate(json.loads(firebase_service_account))
firebase_admin.initialize_app(cred, {
    'databaseURL': firebase_database_url
})

app = Flask(__name__)

# Enable CORS (Allow all domains for simplicity)
CORS(app)

# Set a secret key for Flask sessions
app.secret_key = os.urandom(24)

# Landing Page Route
@app.route('/')
def index():
    return render_template('index.html')

# Route for Tourist Features
@app.route('/sentimentanalysis')
def tourist():
    return render_template('tourist.html')

# Common Login Route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    print(f"Received data: {data}")  # Log the data received
    id_token = data.get('id_token')

    try:
        print(f"Verifying token: {id_token}")
        decoded_token = auth.verify_id_token(id_token)
        print(f"Decoded Token: {decoded_token}")

        uid = decoded_token['uid']
        user = auth.get_user(uid)

        # Retrieve role from custom claims
        role = user.custom_claims.get('role', 'Unknown')
        print(f"User role: {role}")

        # Store user details in session
        session['uid'] = uid
        session['role'] = role

        # Determine dashboard based on role
        if role == "Resort Owner":
            return jsonify({"message": "Login successful", "role": role, "redirect": url_for('resort_owner_dashboard')})
        elif role == "Tourism Officer":
            return jsonify({"message": "Login successful", "role": role, "redirect": url_for('resort_officer_dashboard')})
        else:
            return jsonify({"error": "Unauthorized role"}), 403

    except Exception as e:
        print(f"Error: {str(e)}")  # Log the error
        return jsonify({"error": str(e)}), 401

# Logout Route
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))  # Redirect to landing page

# Routes for Resort Owner
@app.route('/resort-owner-dashboard')
def resort_owner_dashboard():
    if 'role' not in session or session['role'] != 'Resort Owner':
        return redirect(url_for('index'))  # Redirect to landing page if not authorized
    return render_template('Owner/resort-owner-dashboard.html')

@app.route('/loginpage-owner-manager')
def loginpage_owner_manager():
    return render_template('Owner/loginpage-owner-manager.html')

# Routes for Tourism Officer
@app.route('/resort-officer-dashboard')
def resort_officer_dashboard():
    if 'role' not in session or session['role'] != 'Tourism Officer':
        return redirect(url_for('index'))  # Redirect to landing page if not authorized
    return render_template('Officer/resort-officer-dashboard.html')

@app.route('/loginpage-officer-manager')
def loginpage_officer_manager():
    return render_template('Officer/loginpage-officer-manager.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
