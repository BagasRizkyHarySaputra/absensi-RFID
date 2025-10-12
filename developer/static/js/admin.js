let currentId = null;

function updateStatus(id, status) {
  fetch('/api/update_status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id, status: status })
  })
  .then(async (response) => {
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Server mengembalikan non‑JSON:', text);
      showAlert('Server mengembalikan HTML/teks, cek log server.', 'error');
      return;
    }

    if (response.ok) {
      if (data.message) {
        showAlert(data.message, 'success');
        setTimeout(() => location.reload(), 1500);
      } else {
        showAlert(data.error || 'Terjadi kesalahan', 'error');
      }
    } else {
      showAlert(data.error || data.message || `Error ${response.status}`, 'error');
    }
  })
  .catch((error) => {
    showAlert('Error: ' + error, 'error');
    console.error(error);
  });
}

function openRejectModal(id) {
  currentId = id;
  document.getElementById('rejectModal').style.display = 'block';
  document.getElementById('rejectReason').value = '';
}

function closeRejectModal() {
  document.getElementById('rejectModal').style.display = 'none';
  currentId = null;
}

function confirmReject() {
  const reason = document.getElementById('rejectReason').value.trim();
  if (!reason) {
    alert('Alasan penolakan harus diisi!');
    return;
  }

  fetch('/api/update_status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: currentId,
      status: 'ditolak',
      alasan: reason
    })
  })
  .then(async (response) => {
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Server mengembalikan non‑JSON:', text);
      showAlert('Server mengembalikan HTML/teks, cek log server.', 'error');
      return;
    }

    if (response.ok) {
      if (data.message) {
        showAlert(data.message, 'success');
        closeRejectModal();
        setTimeout(() => location.reload(), 1500);
      } else {
        showAlert(data.error || 'Terjadi kesalahan', 'error');
      }
    } else {
      showAlert(data.error || data.message || `Error ${response.status}`, 'error');
    }
  })
  .catch((error) => {
    showAlert('Error: ' + error, 'error');
    console.error(error);
  });
}

function showAlert(message, type) {
  const alert = document.getElementById('alert');
  alert.className = `alert ${type}`;
  alert.textContent = message;
  alert.style.display = 'block';

  setTimeout(() => {
    alert.style.display = 'none';
  }, 5000);
}

window.onclick = function (event) {
  const modal = document.getElementById('rejectModal');
  if (event.target == modal) {
    closeRejectModal();
  }
};