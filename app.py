from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
from dotenv import load_dotenv
import os
from google import genai
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
CORS(app)

# Gemini AI Setup
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Firebase Setup
if not firebase_admin._apps:
    cred = credentials.Certificate('firebase-key.json')
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ==================== ROUTES ====================

# Home Page
@app.route('/')
def index():
    return render_template('index.html')

# Login Page
@app.route('/login')
def login():
    return render_template('login.html')

# Register Page
@app.route('/register')
def register():
    return render_template('register.html')

# Volunteer Dashboard
@app.route('/volunteer')
def volunteer_dashboard():
    return render_template('volunteer_dashboard.html')

# NGO Dashboard
@app.route('/ngo')
def ngo_dashboard():
    return render_template('ngo_dashboard.html')

# Admin Dashboard
@app.route('/admin')
def admin_dashboard():
    return render_template('admin_dashboard.html')

# ==================== API ROUTES ====================

# Save Volunteer Profile
@app.route('/api/volunteer', methods=['POST'])
def save_volunteer():
    try:
        data = request.json
        db.collection('volunteers').document(data['uid']).set({
            'name': data['name'],
            'email': data['email'],
            'skills': data['skills'],
            'location': data['location'],
            'availability': data['availability'],
            'role': 'volunteer',
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'success': True, 'message': 'Volunteer registered!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Save NGO Need
@app.route('/api/need', methods=['POST'])
def save_need():
    try:
        data = request.json
        db.collection('needs').add({
            'title': data['title'],
            'description': data['description'],
            'location': data['location'],
            'urgency': data['urgency'],
            'ngo_name': data['ngo_name'],
            'uid': data['uid'],
            'status': 'open',
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'success': True, 'message': 'Need posted!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# AI Matching
@app.route('/api/match', methods=['POST'])
def ai_match():
    try:
        data = request.json
        volunteer = data['volunteer']
        needs = data['needs']

        prompt = f"""
        You are a smart volunteer matching system.
        
        Volunteer Profile:
        - Name: {volunteer['name']}
        - Skills: {volunteer['skills']}
        - Location: {volunteer['location']}
        - Availability: {volunteer['availability']}
        
        Available Community Needs:
        {needs}
        
        Based on the volunteer's skills and location, suggest the TOP 3 best matching needs.
        For each match explain WHY it's a good match in 1-2 sentences.
        Format your response as JSON with this structure:
        {{
            "matches": [
                {{
                    "need_title": "title",
                    "match_score": 95,
                    "reason": "explanation"
                }}
            ]
        }}
        """

        response = client.models.generate_content(
            model='gemini-2.0-flash-lite',
            contents=prompt
)
        return jsonify({'success': True, 'matches': response.text})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Get All Needs
@app.route('/api/needs', methods=['GET'])
def get_needs():
    try:
        needs = []
        docs = db.collection('needs').where('status', '==', 'open').stream()
        for doc in docs:
            need = doc.to_dict()
            need['id'] = doc.id
            needs.append(need)
        return jsonify({'success': True, 'needs': needs})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Get All Volunteers
@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    try:
        volunteers = []
        docs = db.collection('volunteers').stream()
        for doc in docs:
            vol = doc.to_dict()
            vol['id'] = doc.id
            volunteers.append(vol)
        return jsonify({'success': True, 'volunteers': volunteers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Update Need Status
@app.route('/api/need/<need_id>', methods=['PUT'])
def update_need(need_id):
    try:
        data = request.json
        db.collection('needs').document(need_id).update({
            'status': data['status']
        })
        return jsonify({'success': True, 'message': 'Status updated!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ==================== RUN ====================
if __name__ == '__main__':
    app.run(debug=True)