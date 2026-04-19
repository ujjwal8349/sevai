// SevAI Main JS File

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 30px rgba(0,0,0,0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
        }
    }
});

// Animate Cards on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
});

document.querySelectorAll('.feature-card, .step').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});


async function loadStats() {
    try {
        const volSnap = await db.collection('users')
            .where('role', '==', 'volunteer')
            .get();
        document.getElementById('volCount').innerText = volSnap.size;

        const ngoSnap = await db.collection('users')
            .where('role', '==', 'ngo')
            .get();
        document.getElementById('ngoCount').innerText = ngoSnap.size;

        const needsSnap = await db.collection('needs')
            .where('status', '==', 'completed')
            .get();
        document.getElementById('needsCount').innerText = needsSnap.size;

    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadStats();
});