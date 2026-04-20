let currentUser = null;
let userProfile = null;
let allowNeedsLoad = false;

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
function showSection(section, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(l => l.classList.remove('active'));

    document.getElementById(section + 'Section').classList.add('active');
    if (el) el.classList.add('active');

    if (section === 'needs') {
        allowNeedsLoad = true;   // 🔥 user clicked
        loadNeeds();
    }
}


//Load AllNeeds
async function loadNeeds() {
    if (!allowNeedsLoad) return;
    const needsContent = document.getElementById('needsContent');

    needsContent.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <h3>Loading needs...</h3>
        </div>
    `;

    try {
        const snapshot = await db.collection('needs').get();

        if (!snapshot.empty) {
            needsContent.innerHTML = snapshot.docs.map(doc => {
                const need = doc.data();

                return `
                    <div class="need-card">
                        <div class="need-card-header">
                            <h3>${need.title}</h3>
                            <span>${need.status}</span>
                        </div>

                        <p>${need.description}</p>

                        <div class="need-card-footer">
                            <span><i class="fas fa-map-marker-alt"></i> ${need.location}</span>
                            <span><i class="fas fa-building"></i> ${need.ngo_name || ''}</span>
                        </div>

                        <div style="margin-top: 10px;">
                            ${
                                need.status === 'assigned' &&
                                need.assignedVolunteers &&
                                auth.currentUser &&
                                need.assignedVolunteers.includes(auth.currentUser.uid)
                                ? `<button class="btn-primary" onclick="acceptTask('${doc.id}')">
                                        ✔ Accept Task
                                   </button>`
                                : ''
                            }

                            ${
                                need.status === 'in-progress' &&
                                auth.currentUser &&
                                need.acceptedBy === auth.currentUser.uid
                                ? `<button class="btn-primary" onclick="completeTask('${doc.id}')">
                                        ✅ Mark Completed
                                   </button>`
                                : ''
                            }
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            needsContent.innerHTML = `
                <div class="empty-state">
                    <h3>No needs available</h3>
                </div>
            `;
        }

    } catch (error) {
        console.error(error);
        needsContent.innerHTML = `
            <div class="empty-state">
                <h3>Error loading needs</h3>
            </div>
        `;
    }
}


async function acceptTask(needId) {
    const user = auth.currentUser;

    const res = await fetch(`/api/accept/${needId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            volunteerId: user.uid
        })
    });

    const data = await res.json();

    if (data.success) {
        alert("Task accepted!");
        loadNeeds();
    } else {
        alert("Error!");
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

async function completeTask(needId) {
    const user = auth.currentUser;

    const res = await fetch(`/api/complete/${needId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            volunteerId: user.uid
        })
    });

    const data = await res.json();

    if (data.success) {
        alert("Task completed!");
        loadNeeds();
    } else {
        alert("Error completing task!");
    }
}


