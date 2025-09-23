document.getElementById('testForm').onsubmit = function (e) {
  e.preventDefault();

  const data = {
    nama: document.getElementById('nama').value,
    nis: document.getElementById('nis').value,
    nisn: document.getElementById('nisn').value,
    kelas: document.getElementById('kelas').value,
    password: document.getElementById('password').value
  };

  fetch('/api/absensi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then((response) => response.json())
    .then((result) => {
      const responseDiv = document.getElementById('response');
      const className = result.status === 'success' ? 'success' : 'error';
      responseDiv.className = `response ${className}`;
      responseDiv.innerHTML = `
        <h3>Response:</h3>
        <pre>${JSON.stringify(result, null, 2)}</pre>
      `;
    })
    .catch((error) => {
      document.getElementById('response').innerHTML = `
        <div class="response error">
          <h3>Error:</h3>
          <p>${error}</p>
        </div>
      `;
    });
};