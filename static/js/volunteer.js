let currentUser = null;
let userProfile = null;

// Auth State Check
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserProfile(user);
        loadNeeds();
    } else {
        window.location.href = '/login';
    }
});

// Load User Profile
async function loadUserProfile(user) {
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            userProfile = doc.data();

            // Update UI
            document.getElementById('userName').textContent = userProfile.name;
            document.getElementById('sidebarName').textContent = userProfile.name;
            document.getElementById('sidebarLocation').textContent = '📍 ' + userProfile.location;
            document.getElementById('profileAvatar').textContent = userProfile.name.charAt(0).toUpperCase();

            // Profile Section
            document.getElementById('profileName').textContent = userProfile.name;
            document.getElementById('profileEmail').textContent = userProfile.email;
            document.getElementById('profileLocation').textContent = userProfile.location;
            document.getElementById('profileSkills').textContent = userProfile.skills;
            document.getElementById('profileAvailability').textContent = userProfile.availability;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Show Section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(l => l.classList.remove('active'));

    // Show selected
    document.getElementById(section + 'Section').classList.add('active');
    event.target.closest('li').classList.add('active');

    if (section === 'needs') loadNeeds();
}

// Load All Needs
async function loadNeeds() {
    const needsContent = document.getElementById('needsContent');
    needsContent.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>Loading...</h3></div>';

    try {
        const response = await fetch('/api/needs');
        const data = await response.json();

        if (data.success && data.needs.length > 0) {
            needsContent.innerHTML = data.needs.map(need => `
                <div class="need-card">
                    <div class="need-card-header">
                        <h3>${need.title}</h3>
                        <span class="urgency-badge urgency-${need.urgency}">${need.urgency}</span>
                    </div>
                    <p>${need.description}</p>
                    <div class="need-card-footer">
                        <span><i class="fas fa-map-marker-alt"></i> ${need.location}</span>
                        <span><i class="fas fa-building"></i> ${need.ngo_name}</span>
                        <span><i class="fas fa-circle" style="color: green"></i> ${need.status}</span>
                    </div>
                </div>
            `).join('');
        } else {
            needsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-list"></i>
                    <h3>No community needs posted yet!</h3>
                </div>`;
        }
    } catch (error) {
        needsContent.innerHTML = '<div class="empty-state"><h3>Error loading needs!</h3></div>';
    }
}

// Find AI Matches
async function findAIMatches() {
    const matchesContent = document.getElementById('matchesContent');
    
    // Wait for profile to load
    if (!currentUser) {
        matchesContent.innerHTML = '<div class="empty-state"><h3>Please wait — loading profile...</h3></div>';
        return;
    }

    matchesContent.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>AI is finding best matches for you...</h3></div>';

    try {
        // Get user profile fresh from Firestore
        const doc = await db.collection('users').doc(currentUser.uid).get();
        const profile = doc.data();

        // Get all needs
        const needsResponse = await fetch('/api/needs');
        const needsData = await needsResponse.json();

        if (!needsData.needs || needsData.needs.length === 0) {
            matchesContent.innerHTML = '<div class="empty-state"><i class="fas fa-robot"></i><h3>No needs available to match!</h3></div>';
            return;
        }

        // Call AI Match API
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                volunteer: profile,
                needs: JSON.stringify(needsData.needs)
            })
        });

        const data = await response.json();
        console.log('AI Response:', data);

        if (data.success) {
            let matches;
            try {
                const cleanText = data.matches.replace(/```json|```/g, '').trim();
                matches = JSON.parse(cleanText);
            } catch(e) {
                console.error('Parse error:', e);
                matchesContent.innerHTML = '<div class="empty-state"><h3>AI response error! Try again.</h3></div>';
                return;
            }

            if (matches.matches && matches.matches.length > 0) {
                matchesContent.innerHTML = matches.matches.map((match) => `
                    <div class="match-card">
                        <span class="match-score">🎯 Match Score: ${match.match_score}%</span>
                        <h3>${match.need_title}</h3>
                        <p>${match.reason}</p>
                    </div>
                `).join('');
            } else {
                matchesContent.innerHTML = '<div class="empty-state"><h3>No matches found!</h3></div>';
            }
        } else {
            matchesContent.innerHTML = `<div class="empty-state"><h3>Error: ${data.error}</h3></div>`;
        }
    } catch (error) {
        console.error('Match error:', error);
        matchesContent.innerHTML = '<div class="empty-state"><h3>Error finding matches! Try again.</h3></div>';
    }
}

function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = '/login';
        })
        .catch((error) => {
            console.error("Logout error:", error);
            alert("Logout failed!");
        });
}