let currentUser = null;
let userProfile = null;

// Auth State Check
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserProfile(user);
        loadMyNeeds();
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

            document.getElementById('userName').textContent = userProfile.ngoName || userProfile.name;
            document.getElementById('sidebarName').textContent = userProfile.ngoName || userProfile.name;
            document.getElementById('sidebarLocation').textContent = '📍 ' + userProfile.location;
            document.getElementById('profileAvatar').textContent = (userProfile.ngoName || userProfile.name).charAt(0).toUpperCase();

            document.getElementById('profileName').textContent = userProfile.name;
            document.getElementById('profileEmail').textContent = userProfile.email;
            document.getElementById('profileNgoName').textContent = userProfile.ngoName || '-';
            document.getElementById('profileLocation').textContent = userProfile.location;
            document.getElementById('profileDesc').textContent = userProfile.ngoDesc || '-';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Show Section
function showSection(section, element) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(l => l.classList.remove('active'));

    document.getElementById(section + 'Section').classList.add('active');
    element.classList.add('active');

    if (section === 'myNeeds') loadMyNeeds();
    if (section === 'volunteers') loadVolunteers();
}

// Post Need
async function postNeed() {
    const title = document.getElementById('needTitle').value;
    const desc = document.getElementById('needDesc').value;
    const location = document.getElementById('needLocation').value;
    const urgency = document.getElementById('needUrgency').value;
    const skills = document.getElementById('needSkills').value;
    const volunteers = document.getElementById('needVolunteers').value;
    const postBtn = document.getElementById('postBtn');

    if (!title || !desc || !location) {
        document.getElementById('needError').textContent = 'Please fill all required fields!';
        document.getElementById('needError').style.display = 'block';
        return;
    }

    postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
    postBtn.disabled = true;

    try {
        const response = await fetch('/api/need', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                description: desc,
                location: location,
                urgency: urgency,
                skills_required: skills,
                volunteers_needed: volunteers,
                ngo_name: userProfile.ngoName || userProfile.name,
                uid: currentUser.uid
            })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('needSuccess').textContent = 'Need posted successfully!';
            document.getElementById('needSuccess').style.display = 'block';
            document.getElementById('needError').style.display = 'none';

            // Clear form
            document.getElementById('needTitle').value = '';
            document.getElementById('needDesc').value = '';
            document.getElementById('needLocation').value = '';
            document.getElementById('needSkills').value = '';
            document.getElementById('needVolunteers').value = '';

            postBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Need';
            postBtn.disabled = false;

            setTimeout(() => {
                document.getElementById('needSuccess').style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        document.getElementById('needError').textContent = 'Error posting need!';
        document.getElementById('needError').style.display = 'block';
        postBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Need';
        postBtn.disabled = false;
    }
}

// Load My Needs
async function loadMyNeeds() {
    const myNeedsContent = document.getElementById('myNeedsContent');
    myNeedsContent.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>Loading...</h3></div>';

    try {
        const snapshot = await db.collection('needs')
            .where('uid', '==', currentUser.uid)
            .get();

        if (!snapshot.empty) {
            myNeedsContent.innerHTML = snapshot.docs.map(doc => {
                const need = doc.data();
                return `
                    <div class="need-card">
                        <div class="need-card-header">
                            <h3>${need.title}</h3>
                            <span class="urgency-badge urgency-${need.urgency}">${need.urgency}</span>
                        </div>
                        <p>${need.description}</p>
                        <div class="need-card-footer">
                            <span><i class="fas fa-map-marker-alt"></i> ${need.location}</span>
                            <span><i class="fas fa-circle" style="color: green"></i> ${need.status}</span>
                        </div>
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="btn-primary" style="padding: 8px 20px; font-size: 13px;" 
                                onclick="updateStatus('${doc.id}', 'in-progress')">
                                Mark In Progress
                            </button>
                            <button class="btn-primary" style="padding: 8px 20px; font-size: 13px; background: #00b894;" 
                                onclick="updateStatus('${doc.id}', 'closed')">
                                Mark Closed
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            myNeedsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-list"></i>
                    <h3>No needs posted yet! Post your first need.</h3>
                </div>`;
        }
    } catch (error) {
        myNeedsContent.innerHTML = '<div class="empty-state"><h3>Error loading needs!</h3></div>';
    }
}

// Update Need Status
async function updateStatus(needId, status) {
    try {
        await fetch(`/api/need/${needId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        loadMyNeeds();
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Load Volunteers
async function loadVolunteers() {
    const volunteersContent = document.getElementById('volunteersContent');
    volunteersContent.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>Loading...</h3></div>';

    try {
        const response = await fetch('/api/volunteers');
        const data = await response.json();

        if (data.success && data.volunteers.length > 0) {
            volunteersContent.innerHTML = data.volunteers.map(vol => `
                <div class="volunteer-card">
                    <div class="volunteer-avatar">${vol.name.charAt(0).toUpperCase()}</div>
                    <div class="volunteer-info">
                        <h3>${vol.name}</h3>
                        <p><i class="fas fa-map-marker-alt"></i> ${vol.location}</p>
                        <p><i class="fas fa-calendar"></i> ${vol.availability}</p>
                        <div class="skills-tags">
                            ${vol.skills ? vol.skills.split(',').map(s => 
                                `<span class="skill-tag">${s.trim()}</span>`
                            ).join('') : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            volunteersContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No volunteers registered yet!</h3>
                </div>`;
        }
    } catch (error) {
        volunteersContent.innerHTML = '<div class="empty-state"><h3>Error loading volunteers!</h3></div>';
    }
}

// Logout
function logout() {
    auth.signOut().then(() => {
        window.location.href = '/login';
    });
}