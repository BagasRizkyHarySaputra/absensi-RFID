function applyFilter() {
  const tanggal = document.getElementById('filterTanggal').value;
  const kelas = document.getElementById('filterKelas').value;
  const status = document.getElementById('filterStatus').value;

  let url = '/api/kehadiran?';
  const params = [];

  if (tanggal) params.push(`tanggal=${tanggal}`);
  if (kelas) params.push(`kelas=${encodeURIComponent(kelas)}`);
  if (status) params.push(`status=${status}`);

  url += params.join('&');

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      updateTable(data);
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Gagal memuat data');
    });
}

function clearFilter() {
  const defaultDate = document.getElementById('filterTanggal').getAttribute('value');
  document.getElementById('filterTanggal').value = defaultDate;
  document.getElementById('filterKelas').value = '';
  document.getElementById('filterStatus').value = '';
  applyFilter();
}

function updateTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  data.forEach((entry) => {
    const row = tbody.insertRow();
    const waktu = entry.waktu_absen.substring(0, 19).replace('T', ' ');
    const statusClass = entry.status;
    const keterangan = entry.alasan_ditolak || '✅ Sukses';

    row.innerHTML = `
      <td>${waktu}</td>
      <td><strong>${entry.nama}</strong></td>
      <td>${entry.nis}</td>
      <td>${entry.kelas}</td>
      <td><span class="status ${statusClass}">${entry.status}</span></td>
      <td>${keterangan}</td>
    `;
  });
}

// Auto refresh setiap 30 detik
setInterval(() => {
  console.log('Auto refreshing data...');
  applyFilter();
}, 30000);