// Toggle Password Visibility
function togglePassword() {
    const password = document.getElementById('password');
    password.type = password.type === 'password' ? 'text' : 'password';
}

// Show Error Message
function showError(msg) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

// Hide Error Message
function hideError() {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.style.display = 'none';
}

// Email/Password Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Get user role from Firestore
        const doc = await db.collection('users').doc(user.uid).get();

        if (doc.exists) {
            const role = doc.data().role;
            if (role === 'volunteer') {
                window.location.href = '/volunteer';
            } else if (role === 'ngo') {
                window.location.href = '/ngo';
            } else if (role === 'admin') {
                window.location.href = '/admin';
            }
        } else {
            window.location.href = '/volunteer';
        }

    } catch (error) {
        loginBtn.innerHTML = '<span>Login</span><i class="fas fa-arrow-right"></i>';
        loginBtn.disabled = false;

        switch (error.code) {
            case 'auth/user-not-found':
                showError('No account found with this email!');
                break;
            case 'auth/wrong-password':
                showError('Wrong password! Please try again.');
                break;
            case 'auth/invalid-email':
                showError('Invalid email address!');
                break;
            default:
                showError('Login failed! Please try again.');
        }
    }
});

// Google Login
document.getElementById('googleBtn').addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Check if user exists in Firestore
        const doc = await db.collection('users').doc(user.uid).get();

        if (doc.exists) {
            const role = doc.data().role;
            if (role === 'volunteer') {
                window.location.href = '/volunteer';
            } else if (role === 'ngo') {
                window.location.href = '/ngo';
            } else {
                window.location.href = '/volunteer';
            }
        } else {
            // New user — save to Firestore
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                role: 'volunteer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.location.href = '/volunteer';
        }

    } catch (error) {
        showError('Google login failed! Please try again.');
    }
});