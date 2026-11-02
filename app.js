let transactions = JSON.parse(localStorage.getItem('my_finance_data')) || [];

const form = document.getElementById('finance-form');
const list = document.getElementById('transaction-list');
const btnPdf = document.getElementById('btn-pdf');

// Element Saldo
const elGopay = document.getElementById('saldo-gopay');
const elBni = document.getElementById('saldo-bni');
const elTotal = document.getElementById('saldo-total');

// Format Rupiah (Pakai Math.round biar tidak ada bug 299999)
function formatRupiah(number) {
  const rounded = Math.round(number);
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(rounded);
}

// Update Perhitungan Saldo & Tampilan
function updateDashboard() {
  let gopay = 0;
  let bni = 0;

  transactions.forEach(item => {
    const nominal = Math.round(parseFloat(item.nominal) || 0);
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
  
  if (transactions.length === 0) {
    list.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#A0A0A0; padding:20px;">Belum ada catatan transaksi ✨</td></tr>`;
    return;
  }

  transactions.slice().reverse().forEach((item, index) => {
    const realIndex = transactions.length - 1 - index;
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${item.tanggal}</td>
      <td><span class="badge badge-${item.tipe}">${item.tipe.toUpperCase()}</span></td>
      <td><strong>${item.tujuan}</strong></td>
      <td>${item.keterangan}</td>
      <td class="amount">${formatRupiah(item.nominal)}</td>
      <td><button class="btn-delete" onclick="deleteTransaction(${realIndex})" title="Hapus">✕</button></td>
    `;
    list.appendChild(tr);
  });
}

// Tambah Transaksi Baru
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const tipe = document.getElementById('tipe').value;
  // Gunakan Math.round agar input selalu bulat
  const nominal = Math.round(parseFloat(document.getElementById('nominal').value));
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
  if (transactions.length === 0) {
    alert("Belum ada data transaksi untuk dicetak!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Laporan Catatan Keuangan - Moneysyaa", 14, 15);
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);
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
    headStyles: { fillColor: [230, 215, 235], textColor: [74, 74, 74] }
  });

  doc.save(`Laporan-Moneysyaa-${Date.now()}.pdf`);
});

// Load awal
updateDashboard();