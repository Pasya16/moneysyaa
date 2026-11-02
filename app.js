let transactions = JSON.parse(localStorage.getItem('my_finance_data')) || [];

const form = document.getElementById('finance-form');
const list = document.getElementById('transaction-list');
const btnPdf = document.getElementById('btn-pdf');

// Element Saldo
const elGopay = document.getElementById('saldo-gopay');
const elBni = document.getElementById('saldo-bni');
const elTotal = document.getElementById('saldo-total');

// Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

// Update Perhitungan Saldo & Tampilan
function updateDashboard() {
  let gopay = 0;
  let bni = 0;

  transactions.forEach(item => {
    const nominal = parseFloat(item.nominal);
    if (item.tipe === 'pemasukan') {
      gopay += nominal;
    } else if (item.tipe === 'pengeluaran') {
      gopay -= nominal;
    } else if (item.tipe === 'tabung') {
      gopay -= nominal;
      bni += nominal;
    }
  });

  elGopay.textContent = formatRupiah(gopay);
  elBni.textContent = formatRupiah(bni);
  elTotal.textContent = formatRupiah(gopay + bni);

  renderList();
  localStorage.setItem('my_finance_data', JSON.stringify(transactions));
}

// Render Tabel Riwayat
function renderList() {
  list.innerHTML = '';
  transactions.slice().reverse().forEach((item, index) => {
    const realIndex = transactions.length - 1 - index;
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${item.tanggal}</td>
      <td><span class="badge badge-${item.tipe}">${item.tipe.toUpperCase()}</span></td>
      <td>${item.tujuan}</td>
      <td>${item.keterangan}</td>
      <td>${formatRupiah(item.nominal)}</td>
      <td><button class="btn-delete" onclick="deleteTransaction(${realIndex})">✕</button></td>
    `;
    list.appendChild(tr);
  });
}

// Tambah Transaksi Baru
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const tipe = document.getElementById('tipe').value;
  const nominal = parseFloat(document.getElementById('nominal').value);
  const tujuan = document.getElementById('tujuan').value;
  const keterangan = document.getElementById('keterangan').value;

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  transactions.push({ tanggal: today, tipe, nominal, tujuan, keterangan });
  updateDashboard();
  form.reset();
});

// Hapus Transaksi
function deleteTransaction(index) {
  transactions.splice(index, 1);
  updateDashboard();
}

// Fitur Download PDF Laporan
btnPdf.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Laporan Catatan Keuangan", 14, 15);
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

  // Ringkasan di PDF
  doc.text(`Saldo GoPay: ${elGopay.textContent} | Tabungan BNI: ${elBni.textContent}`, 14, 28);

  const tableData = transactions.map(t => [
    t.tanggal,
    t.tipe.toUpperCase(),
    t.tujuan,
    t.keterangan,
    formatRupiah(t.nominal)
  ]);

  doc.autoTable({
    startY: 34,
    head: [['Tanggal', 'Tipe', 'Penerima / Media', 'Keterangan', 'Nominal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [212, 230, 241], textColor: [50, 50, 50] }
  });

  doc.save(`Laporan-Keuangan-${Date.now()}.pdf`);
});

// Load awal
updateDashboard();