// Tab Switching
document.getElementById('jadwal-btn').addEventListener('click', function() {
    showJadwal();
});

document.getElementById('histori-btn').addEventListener('click', function() {
    showHistori();
});

function showJadwal() {
    document.body.classList.remove('page-histori');
    document.body.classList.add('page-jadwal');
}

function showHistori() {
    document.body.classList.remove('page-jadwal');
    document.body.classList.add('page-histori');
}

// Modal Popup Functions
function showPopup(title, message) {
    const modal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    
    modalTitle.textContent = title;
    modalText.textContent = message;
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('info-modal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('info-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Close modal with ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Initialize - Show History by default
document.addEventListener('DOMContentLoaded', function() {
    showHistori();
});
