// Auth Check
auth.onAuthStateChanged(async (user) => {
    if (user) {
        loadOverview();
    } else {
        window.location.href = '/login';
    }
});

// Show Section
function showSection(section, element) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(l => l.classList.remove('active'));

    document.getElementById(section + 'Section').classList.add('active');
    element.classList.add('active');

    if (section === 'volunteers') loadVolunteers();
    if (section === 'ngos') loadNGOs();
    if (section === 'needs') loadAllNeeds();
}

// Load Overview
async function loadOverview() {
    try {
        // Get volunteers count
        const volunteers = await db.collection('volunteers').get();
        document.getElementById('totalVolunteers').textContent = volunteers.size;

        // Get NGOs count
        const ngos = await db.collection('ngos').get();
        document.getElementById('totalNGOs').textContent = ngos.size;

        // Get needs count
        const needs = await db.collection('needs').get();
        document.getElementById('totalNeeds').textContent = needs.size;

        // Get open needs count
        const openNeeds = await db.collection('needs').where('status', '==', 'open').get();
        document.getElementById('openNeeds').textContent = openNeeds.size;

        // Recent needs
        const recentNeeds = document.getElementById('recentNeeds');
        if (!needs.empty) {
            recentNeeds.innerHTML = needs.docs.slice(0, 5).map(doc => {
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
                            <span><i class="fas fa-building"></i> ${need.ngo_name}</span>
                            <span><i class="fas fa-circle" style="color: green"></i> ${need.status}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            recentNeeds.innerHTML = '<div class="empty-state"><i class="fas fa-list"></i><h3>No needs yet!</h3></div>';
        }
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

// Load All Volunteers
async function loadVolunteers() {
    const volunteersContent = document.getElementById('volunteersContent');
    volunteersContent.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>Loading...</h3></div>';

    try {
        const snapshot = await db.collection('volunteers').get();

        if (!snapshot.empty) {
            volunteersContent.innerHTML = snapshot.docs.map(doc => {
                const vol = doc.data();
                return `
                    <div class="volunteer-card">
                        <div class="volunteer-avatar">${vol.name.charAt(0).toUpperCase()}</div>
                        <div class="volunteer-info">
                            <h3>${vol.name}</h3>
                            <p><i class="fas fa-envelope"></i> ${vol.email}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${vol.location}</p>
                            <p><i class="fas fa-calendar"></i> ${vol.availability}</p>
                            <div class="skills-tags">
                                ${vol.skills ? vol.skills.split(',').map(s =>
                                    `<span class="skill-tag">${s.trim()}</span>`
                                ).join('') : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            volunteersContent.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No volunteers yet!</h3></div>';
        }
    } catch (error) {
        volunteersContent.innerHTML = '<div class="empty-state"><h3>Error loading volunteers!</h3></div>';
    }
}

// Load All NGOs
async function loadNGOs() {
    const ngosContent = document.getElementById('ngosContent');
    ngosContent.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>Loading...</h3></div>';

    try {
        const snapshot = await db.collection('ngos').get();

        if (!snapshot.empty) {
            ngosContent.innerHTML = snapshot.docs.map(doc => {
                const ngo = doc.data();
                return `
                    <div class="volunteer-card">
                        <div class="volunteer-avatar" style="background: #00b894;">
                            ${(ngo.ngoName || ngo.name).charAt(0).toUpperCase()}
                        </div>
                        <div class="volunteer-info">
                            <h3>${ngo.ngoName || ngo.name}</h3>
                            <p><i class="fas fa-user"></i> ${ngo.name}</p>
                            <p><i class="fas fa-envelope"></i> ${ngo.email}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${ngo.location}</p>
                            <p><i class="fas fa-info-circle"></i> ${ngo.ngoDesc || '-'}</p>
                        </div>
                        <div style="margin-left: auto;">
                            <span class="urgency-badge ${ngo.verified ? 'urgency-Low' : 'urgency-High'}">
                                ${ngo.verified ? '✅ Verified' : '⏳ Pending'}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            ngosContent.innerHTML = '<div class="empty-state"><i class="fas fa-building"></i><h3>No NGOs yet!</h3></div>';
        }
    } catch (error) {
        ngosContent.innerHTML = '<div class="empty-state"><h3>Error loading NGOs!</h3></div>';
    }
}

// Load All Needs
async function loadAllNeeds() {
    const needsContent = document.getElementById('needsContent');
    needsContent.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>Loading...</h3></div>';

    try {
        const snapshot = await db.collection('needs').get();

        if (!snapshot.empty) {
            needsContent.innerHTML = snapshot.docs.map(doc => {
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
                            <span><i class="fas fa-building"></i> ${need.ngo_name}</span>
                            <span><i class="fas fa-circle" style="color: green"></i> ${need.status}</span>
                        </div>
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            
                            <button class="btn-primary" 
                                onclick="autoAssign('${doc.id}')">
                                ⚡ Auto Assign
                            </button>

                            <button class="btn-primary" 
                                style="padding: 8px 20px; font-size: 13px; background: #d63031;"
                                onclick="deleteNeed('${doc.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>

                        </div>
                    </div>
                `;
            }).join('');
        } else {
            needsContent.innerHTML = '<div class="empty-state"><i class="fas fa-list"></i><h3>No needs yet!</h3></div>';
        }
    } catch (error) {
        needsContent.innerHTML = '<div class="empty-state"><h3>Error loading needs!</h3></div>';
    }
}

// Delete Need
async function deleteNeed(needId) {
    if (confirm('Are you sure you want to delete this need?')) {
        try {
            await db.collection('needs').doc(needId).delete();
            loadAllNeeds();
        } catch (error) {
            console.error('Error deleting need:', error);
        }
    }
}

// Logout
function logout() {
    auth.signOut().then(() => {
        window.location.href = '/login';
    });
}


async function autoAssign(needId) {
    alert("Clicked: " + needId);  

    try {
        const response = await fetch(`/api/auto-assign/${needId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            alert("Assigned!");
            loadAllNeeds();
        } else {
            alert("Failed: " + data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Error!");
    }
}