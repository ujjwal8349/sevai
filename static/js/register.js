// Selected Role
let selectedRole = 'volunteer';

// Select Role
function selectRole(role) {
    selectedRole = role;

    document.getElementById('volunteerRole').classList.remove('active');
    document.getElementById('ngoRole').classList.remove('active');
    document.getElementById(role + 'Role').classList.add('active');

    if (role === 'volunteer') {
        document.getElementById('volunteerFields').style.display = 'block';
        document.getElementById('ngoFields').style.display = 'none';
    } else {
        document.getElementById('volunteerFields').style.display = 'none';
        document.getElementById('ngoFields').style.display = 'block';
    }
}

// Toggle Password
function togglePassword() {
    const password = document.getElementById('password');
    password.type = password.type === 'password' ? 'text' : 'password';
}

// Show Messages
function showError(msg) {
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('errorMsg').style.display = 'block';
    document.getElementById('successMsg').style.display = 'none';
}

function showSuccess(msg) {
    document.getElementById('successMsg').textContent = msg;
    document.getElementById('successMsg').style.display = 'block';
    document.getElementById('errorMsg').style.display = 'none';
}

// Register Form Submit
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const location = document.getElementById('location').value;
    const registerBtn = document.getElementById('registerBtn');

    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    registerBtn.disabled = true;

    try {
        // Create Firebase Auth User
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update Display Name
        await user.updateProfile({ displayName: name });

        // Save to Firestore based on role
        if (selectedRole === 'volunteer') {
            const skills = document.getElementById('skills').value;
            const availability = document.getElementById('availability').value;

            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'volunteer',
                location: location,
                skills: skills,
                availability: availability,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('volunteers').doc(user.uid).set({
                name: name,
                email: email,
                location: location,
                skills: skills,
                availability: availability,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showSuccess('Account created! Redirecting...');
            setTimeout(() => window.location.href = '/volunteer', 1500);

        } else {
            const ngoName = document.getElementById('ngoName').value;
            const ngoDesc = document.getElementById('ngoDesc').value;

            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'ngo',
                location: location,
                ngoName: ngoName,
                ngoDesc: ngoDesc,
                verified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('ngos').doc(user.uid).set({
                name: name,
                email: email,
                location: location,
                ngoName: ngoName,
                ngoDesc: ngoDesc,
                verified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showSuccess('NGO Account created! Redirecting...');
            setTimeout(() => window.location.href = '/ngo', 1500);
        }

    } catch (error) {
        registerBtn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
        registerBtn.disabled = false;

        switch (error.code) {
            case 'auth/email-already-in-use':
                showError('Email already registered! Please login.');
                break;
            case 'auth/weak-password':
                showError('Password too weak! Use at least 6 characters.');
                break;
            case 'auth/invalid-email':
                showError('Invalid email address!');
                break;
            default:
                showError('Registration failed! Please try again.');
        }
    }
});