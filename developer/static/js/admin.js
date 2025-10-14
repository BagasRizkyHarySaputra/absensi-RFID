// State management
let currentPage = 'jurusan';
let selectedIzin = null;
let currentJurusan = null;
let liveInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initNavigation();
  initJurusanCards();
  initSearch();
  initModal();
  loadIzinData();
});

// Navigation
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const page = this.getAttribute('data-page');
      switchPage(page);
      
      // Update active state
      navBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

function switchPage(page) {
  currentPage = page;
  
  // Stop live interval if leaving live page
  if (liveInterval && page !== 'live') {
    clearInterval(liveInterval);
    liveInterval = null;
  }
  
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(p => {
    p.classList.add('hidden');
  });
  
  // Show selected page
  document.getElementById(page + '-page').classList.remove('hidden');
  
  // Load data for specific page
  if (page === 'live') {
    loadLiveKehadiran();
    // Auto refresh every 5 seconds
    liveInterval = setInterval(loadLiveKehadiran, 5000);
  } else if (page === 'pengajuan') {
    loadIzinData();
  }
}

// Jurusan Cards
function initJurusanCards() {
  const cards = document.querySelectorAll('.jurusan-card');
  
  cards.forEach(card => {
    card.addEventListener('click', function() {
      const jurusan = this.getAttribute('data-jurusan');
      openKelasModal(jurusan);
    });
  });
}

// Modal
function initModal() {
  const modal = document.getElementById('kelasModal');
  const closeBtn = document.querySelector('.close');
  
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function openKelasModal(jurusan) {
  currentJurusan = jurusan;
  const modal = document.getElementById('kelasModal');
  const title = document.getElementById('modalTitle');
  
  title.textContent = `Data Presensi ${jurusan}`;
  
  // Load data from API
  loadKelasDataCalendar(jurusan);
  
  modal.style.display = 'block';
}

function loadKelasDataCalendar(jurusan) {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '<p style="text-align: center; padding: 50px;">Loading...</p>';
  
  // Fetch data from API
  fetch(`/api/kehadiran_by_jurusan?jurusan=${jurusan}`)
    .then(response => response.json())
    .then(result => {
      console.log('Data received for', jurusan, ':', result);
      
      if (result.error) {
        container.innerHTML = `<p style="text-align: center; color: red; padding: 50px;">Error: ${result.error}</p>`;
        return;
      }
      
      const data = result.kehadiran || [];
      const allSiswa = result.siswa || [];
      
      if (allSiswa.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">Tidak ada siswa di jurusan ini</p>';
        return;
      }
      
      // Get unique dates from kehadiran data
      const dates = new Set();
      data.forEach(item => {
        const waktu = new Date(item.waktu_absen);
        const dateStr = `${String(waktu.getMonth() + 1).padStart(2, '0')}/${String(waktu.getDate()).padStart(2, '0')}`;
        dates.add(dateStr);
      });
      
      // Sort dates
      const sortedDates = Array.from(dates).sort((a, b) => {
        const [ma, da] = a.split('/').map(Number);
        const [mb, db] = b.split('/').map(Number);
        return ma === mb ? da - db : ma - mb;
      });
      
      // Limit to last 5 dates (or show message if no dates)
      const recentDates = sortedDates.length > 0 ? sortedDates.slice(-5) : [];
      
      if (recentDates.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">Belum ada data presensi</p>';
        return;
      }
      
      // Build attendance map for each student
      const studentData = {};
      allSiswa.forEach(siswa => {
        studentData[siswa.nis] = {
          nama: siswa.nama,
          nis: siswa.nis,
          kelas: siswa.kelas,
          attendance: {}
        };
      });
      
      // Fill in attendance data
      data.forEach(item => {
        const waktu = new Date(item.waktu_absen);
        const dateStr = `${String(waktu.getMonth() + 1).padStart(2, '0')}/${String(waktu.getDate()).padStart(2, '0')}`;
        
        if (studentData[item.nis]) {
          studentData[item.nis].attendance[dateStr] = {
            status: item.status,
            alasan: item.alasan_ditolak,
            waktu: item.waktu_absen
          };
        }
      });
      
      // Build calendar HTML
      let html = '<div class="date-header">';
      html += '<div class="student-name">Nama</div>';
      html += '<div class="date-labels">';
      recentDates.forEach(date => {
        html += `<div class="date-label">${date}</div>`;
      });
      html += '</div></div>';
      
      // Build student rows
      Object.values(studentData).forEach((student, studentIndex) => {
        html += '<div class="student-row">';
        html += `<div class="student-name">${student.nama}</div>`;
        html += '<div class="date-grid">';
        
        recentDates.forEach((date, dateIndex) => {
          const attendance = student.attendance[date];
          const cellId = `cell-${studentIndex}-${dateIndex}`;
          
          if (attendance) {
            const statusClass = attendance.status.toLowerCase();
            const alasanEscaped = (attendance.alasan || 'Tidak ada keterangan').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            
            html += `<div class="status-cell ${statusClass}" 
                          id="${cellId}"
                          onclick="toggleCellDetail(event, '${cellId}', '${alasanEscaped}')">
                    </div>`;
          } else {
            // Tidak ada data = dianggap tidak hadir (merah)
            html += `<div class="status-cell kosong" 
                          id="${cellId}"
                          onclick="toggleCellDetail(event, '${cellId}', 'Tidak hadir / Tidak absen')">
                    </div>`;
          }
        });
        
        html += '</div></div>';
      });
      
      container.innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading data:', error);
      container.innerHTML = '<p style="text-align: center; color: red; padding: 50px;">Gagal memuat data</p>';
    });
}

function toggleCellDetail(event, cellId, alasan) {
  event.stopPropagation(); // Prevent event bubbling
  
  const cell = document.getElementById(cellId);
  if (!cell || !alasan || alasan.trim() === '') return;
  
  // Remove existing popups
  document.querySelectorAll('.detail-popup').forEach(p => p.remove());
  
  // Check if clicking same cell - toggle off
  if (cell.dataset.popupActive === 'true') {
    cell.dataset.popupActive = 'false';
    return;
  }
  
  // Mark this cell as having active popup
  cell.dataset.popupActive = 'true';
  
  // Create popup
  const popup = document.createElement('div');
  popup.className = 'detail-popup show';
  popup.innerHTML = `
    <strong>📋 Alasan Ditolak:</strong>
    <p>${alasan}</p>
  `;
  
  // Add to body for fixed positioning
  document.body.appendChild(popup);
  
  // Get cell position
  const rect = cell.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  
  // Calculate position (below cell by default)
  let top = rect.bottom + window.scrollY + 10;
  let left = rect.left + window.scrollX;
  
  // Check if popup goes off screen bottom - move above if needed
  if (top + popupRect.height > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - popupRect.height - 10;
  }
  
  // Check if popup goes off screen right
  if (left + popupRect.width > window.innerWidth) {
    left = window.innerWidth - popupRect.width - 20;
  }
  
  // Check if popup goes off screen left
  if (left < 10) {
    left = 10;
  }
  
  // Apply final position
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  
  // Close popup when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target) && e.target !== cell) {
        popup.remove();
        cell.dataset.popupActive = 'false';
        document.removeEventListener('click', closePopup);
      }
    });
  }, 100);
}

function loadKelasData(jurusan) {
  const tbody = document.getElementById('kelasTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Loading...</td></tr>';
  
  // Fetch data from API
  fetch(`/api/kehadiran_by_jurusan?jurusan=${jurusan}`)
    .then(response => response.json())
    .then(data => {
      console.log('Data received for', jurusan, ':', data); // Debug log
      
      if (data.error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: red;">Error: ${data.error}</td></tr>`;
        return;
      }
      
      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">Belum ada data presensi untuk jurusan ini</td></tr>';
        return;
      }
      
      tbody.innerHTML = '';
      data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;
        const waktu = new Date(item.waktu_absen);
        const tanggal = `${String(waktu.getMonth() + 1).padStart(2, '0')}/${String(waktu.getDate()).padStart(2, '0')}`;
        const jam = waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const statusClass = item.status.toLowerCase();
        
        // Check if has alasan ditolak
        const hasDetail = item.alasan_ditolak && item.alasan_ditolak.trim() !== '';
        const clickableClass = hasDetail ? 'clickable' : '';
        const statusIcon = item.status === 'ditolak' ? '❌' : '';
        
        row.innerHTML = `
          <td>${tanggal}</td>
          <td>${item.nama}</td>
          <td>${item.nis}</td>
          <td>${item.kelas}</td>
          <td>
            <span class="status-badge status-${statusClass} ${clickableClass}" 
                  onclick="toggleDetail(${index})" 
                  style="${hasDetail ? 'cursor: pointer;' : ''}">
              ${statusIcon} ${item.status}
            </span>
          </td>
          <td>${item.status === 'hadir' ? jam : '-'}</td>
        `;
        
        tbody.appendChild(row);
        
        // Add detail row if has alasan_ditolak
        if (hasDetail) {
          const detailRow = document.createElement('tr');
          detailRow.className = 'detail-row';
          detailRow.dataset.index = index;
          detailRow.innerHTML = `
            <td colspan="6">
              <div class="detail-content">
                <strong>📋 Alasan Ditolak:</strong>
                <p>${item.alasan_ditolak}</p>
              </div>
            </td>
          `;
          tbody.appendChild(detailRow);
        }
      });
    })
    .catch(error => {
      console.error('Error loading data:', error);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: red;">Gagal memuat data</td></tr>';
    });
}

function toggleDetail(index) {
  const detailRow = document.querySelector(`.detail-row[data-index="${index}"]`);
  if (detailRow) {
    detailRow.classList.toggle('show');
  }
}

function filterByDate(dateValue) {
  if (!currentJurusan) return;
  
  const tbody = document.getElementById('kelasTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Loading...</td></tr>';
  
  // Fetch filtered data from API
  fetch(`/api/kehadiran_by_jurusan?jurusan=${currentJurusan}&tanggal=${dateValue}`)
    .then(response => response.json())
    .then(data => {
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">Tidak ada data untuk tanggal ini</td></tr>';
        return;
      }
      
      tbody.innerHTML = '';
      data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;
        const waktu = new Date(item.waktu_absen);
        const tanggal = `${String(waktu.getMonth() + 1).padStart(2, '0')}/${String(waktu.getDate()).padStart(2, '0')}`;
        const jam = waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const statusClass = item.status.toLowerCase();
        
        const hasDetail = item.alasan_ditolak && item.alasan_ditolak.trim() !== '';
        const clickableClass = hasDetail ? 'clickable' : '';
        const statusIcon = item.status === 'ditolak' ? '❌' : '';
        
        row.innerHTML = `
          <td>${tanggal}</td>
          <td>${item.nama}</td>
          <td>${item.nis}</td>
          <td>${item.kelas}</td>
          <td>
            <span class="status-badge status-${statusClass} ${clickableClass}" 
                  onclick="toggleDetail(${index})" 
                  style="${hasDetail ? 'cursor: pointer;' : ''}">
              ${statusIcon} ${item.status}
            </span>
          </td>
          <td>${item.status === 'hadir' ? jam : '-'}</td>
        `;
        
        tbody.appendChild(row);
        
        if (hasDetail) {
          const detailRow = document.createElement('tr');
          detailRow.className = 'detail-row';
          detailRow.dataset.index = index;
          detailRow.innerHTML = `
            <td colspan="6">
              <div class="detail-content">
                <strong>📋 Alasan Ditolak:</strong>
                <p>${item.alasan_ditolak}</p>
              </div>
            </td>
          `;
          tbody.appendChild(detailRow);
        }
      });
    })
    .catch(error => {
      console.error('Error:', error);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: red;">Gagal memuat data</td></tr>';
    });
}

// Search functionality
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.querySelector('.search-btn');
  
  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
      alert('Masukkan kata kunci pencarian');
      return;
    }
    
    // Search using API
    fetch(`/api/kehadiran?limit=500`)
      .then(response => response.json())
      .then(data => {
        const results = data.filter(item => 
          item.nama.toLowerCase().includes(query) ||
          item.nis.includes(query) ||
          item.kelas.toLowerCase().includes(query)
        );
        
        if (results.length === 0) {
          alert('Tidak ada data yang ditemukan');
          return;
        }
        
        showSearchResults(results, query);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Gagal melakukan pencarian');
      });
  }
  
  searchBtn.addEventListener('click', performSearch);
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

function showSearchResults(results, query) {
  const modal = document.getElementById('kelasModal');
  const title = document.getElementById('modalTitle');
  const tbody = document.getElementById('kelasTableBody');
  
  title.textContent = `Hasil Pencarian: "${query}"`;
  
  tbody.innerHTML = '';
  results.forEach((item, index) => {
    const row = document.createElement('tr');
    row.dataset.index = index;
    const waktu = new Date(item.waktu_absen);
    const tanggal = `${String(waktu.getMonth() + 1).padStart(2, '0')}/${String(waktu.getDate()).padStart(2, '0')}`;
    const jam = waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const statusClass = item.status.toLowerCase();
    
    const hasDetail = item.alasan_ditolak && item.alasan_ditolak.trim() !== '';
    const clickableClass = hasDetail ? 'clickable' : '';
    const statusIcon = item.status === 'ditolak' ? '❌' : '';
    
    row.innerHTML = `
      <td>${tanggal}</td>
      <td>${item.nama}</td>
      <td>${item.nis}</td>
      <td>${item.kelas}</td>
      <td>
        <span class="status-badge status-${statusClass} ${clickableClass}" 
              onclick="toggleDetail(${index})" 
              style="${hasDetail ? 'cursor: pointer;' : ''}">
          ${statusIcon} ${item.status}
        </span>
      </td>
      <td>${item.status === 'hadir' ? jam : '-'}</td>
    `;
    
    tbody.appendChild(row);
    
    if (hasDetail) {
      const detailRow = document.createElement('tr');
      detailRow.className = 'detail-row';
      detailRow.dataset.index = index;
      detailRow.innerHTML = `
        <td colspan="6">
          <div class="detail-content">
            <strong>📋 Alasan Ditolak:</strong>
            <p>${item.alasan_ditolak}</p>
          </div>
        </td>
      `;
      tbody.appendChild(detailRow);
    }
  });
  
  modal.style.display = 'block';
}

// Live Kehadiran
function loadLiveKehadiran() {
  fetch('/api/live_kehadiran?limit=50')
    .then(response => response.json())
    .then(data => {
      const container = document.querySelector('.live-container');
      
      if (data.error) {
        container.innerHTML = '<h2>Error memuat data</h2>';
        return;
      }
      
      let html = '<h2>Live Request Presensi<br>(disetujui, ditolak, gagal, dan berhasil)</h2>';
      html += '<div class="live-table-container"><table class="live-table">';
      html += '<thead><tr><th>Waktu</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Status</th><th>Keterangan</th></tr></thead>';
      html += '<tbody>';
      
      data.forEach(item => {
        const waktu = new Date(item.waktu_absen);
        const waktuStr = waktu.toLocaleString('id-ID');
        const statusClass = item.status.toLowerCase();
        const statusIcon = item.status === 'hadir' ? '✅' : '❌';
        const keterangan = item.alasan_ditolak || 'Berhasil';
        
        html += `
          <tr>
            <td>${waktuStr}</td>
            <td><strong>${item.nama}</strong></td>
            <td>${item.nis}</td>
            <td>${item.kelas}</td>
            <td><span class="status-badge status-${statusClass}">${statusIcon} ${item.status}</span></td>
            <td>${keterangan}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div>';
      container.innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading live data:', error);
    });
}

// Izin Data
function loadIzinData() {
  const izinList = document.getElementById('izinList');
  izinList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Loading...</p>';
  
  fetch('/api/izin_siswa')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        izinList.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Error memuat data</p>';
        return;
      }
      
      if (data.length === 0) {
        izinList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Tidak ada pengajuan izin</p>';
        return;
      }
      
      izinList.innerHTML = '';
      data.forEach(izin => {
        const item = document.createElement('div');
        item.className = 'izin-item';
        const waktu = new Date(izin.waktu_absen);
        const tanggal = waktu.toLocaleDateString('id-ID');
        
        item.innerHTML = `
          <div>
            <strong>${izin.nama}</strong><br>
            <small>${izin.nis} - ${izin.kelas}</small>
          </div>
          <div style="text-align: right;">
            <small>${tanggal}</small>
          </div>
        `;
        
        item.addEventListener('click', function() {
          selectIzin(izin, item);
        });
        
        izinList.appendChild(item);
      });
    })
    .catch(error => {
      console.error('Error loading izin:', error);
      izinList.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Gagal memuat data</p>';
    });
}

function selectIzin(izin, element) {
  // Remove previous selection
  document.querySelectorAll('.izin-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  // Add selection
  element.classList.add('selected');
  selectedIzin = izin;
  
  // Show alasan
  const alasan = izin.alasan_ditolak || 'Tidak ada keterangan';
  document.getElementById('alasanText').textContent = alasan;
}