let transactions = JSON.parse(localStorage.getItem('my_finance_data')) || [];

const form = document.getElementById('finance-form');
const list = document.getElementById('transaction-list');
const btnPdf = document.getElementById('btn-pdf');
const selectTipe = document.getElementById('tipe');
const inputNominal = document.getElementById('nominal');

// Element Dynamic Form Fields
const modeIndicator = document.getElementById('mode-indicator');
const groupTujuan = document.getElementById('group-tujuan');
const labelKeterangan = document.getElementById('label-keterangan');
const inputKeterangan = document.getElementById('keterangan');

// Element Saldo
const elGopay = document.getElementById('saldo-gopay');
const elBni = document.getElementById('saldo-bni');
const elTotal = document.getElementById('saldo-total');

// Format Angka ke Rupiah Teks
function formatRupiah(number) {
  const rounded = Math.round(number);
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(rounded);
}

// Format Input Angka dengan Titik Ribuan Otomatis saat Ngetik
inputNominal.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  if (value) {
    e.target.value = new Intl.NumberFormat('id-ID').format(parseInt(value, 10));
  } else {
    e.target.value = '';
  }
});

// Logika Perubahan Tampilan Form (Laptop & HP Touch Compatible)
function handleFormLayoutChange() {
  const tipe = selectTipe.value;

  if (tipe === 'pemasukan') {
    modeIndicator.textContent = "Mode: Pemasukan / Top-Up";
    modeIndicator.style.color = "#27AE60";
    
    groupTujuan.classList.add('hidden-field');
    labelKeterangan.textContent = "Sumber Pemasukan";
    inputKeterangan.placeholder = "Contoh: Uang Saku, Transfer Teman, dll";

  } else if (tipe === 'pengeluaran') {
    modeIndicator.textContent = "Mode: Pengeluaran (Bayar)";
    modeIndicator.style.color = "#C0392B";

    groupTujuan.classList.remove('hidden-field');
    labelKeterangan.textContent = "Nama Penerima / Catatan";
    inputKeterangan.placeholder = "Contoh: Makan siang, Beli Kuota, dll";

  } else if (tipe === 'tabung') {
    modeIndicator.textContent = "Mode: Nabung (GoPay ke BNI)";
    modeIndicator.style.color = "#2980B9";

    groupTujuan.classList.add('hidden-field');
    labelKeterangan.textContent = "Catatan Tabungan";
    inputKeterangan.placeholder = "Contoh: Menyisihkan sisa mingguan";
  }
}

// Update Saldo & LocalStorage
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

// Render Tabel Riwayat Transaksi
function renderList() {
  list.innerHTML = '';
  
  if (transactions.length === 0) {
    list.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#A0A0A0; padding:25px;">Belum ada catatan transaksi</td></tr>`;
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
      <td><button class="btn-delete" onclick="deleteTransaction(${realIndex})" title="Hapus">X</button></td>
    `;
    list.appendChild(tr);
  });
}

// Submit Form
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const tipe = selectTipe.value;
  const rawNominal = inputNominal.value.replace(/\./g, '');
  const nominal = Math.round(parseFloat(rawNominal));

  if (!nominal || isNaN(nominal)) {
    alert("Masukkan nominal angka yang valid!");
    return;
  }

  let tujuan = document.getElementById('tujuan').value;
  const keterangan = inputKeterangan.value;

  if (tipe === 'pemasukan') {
    tujuan = "Top-Up GoPay";
  } else if (tipe === 'tabung') {
    tujuan = "Bank BNI (Tabungan)";
  }

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  transactions.push({ tanggal: today, tipe, nominal, tujuan, keterangan });
  updateDashboard();
  form.reset();
  handleFormLayoutChange();
});

// Hapus Transaksi
function deleteTransaction(index) {
  transactions.splice(index, 1);
  updateDashboard();
}

// Listener Perubahan Dropdown Tipe (Dual Event untuk HP & Laptop)
selectTipe.addEventListener('change', handleFormLayoutChange);
selectTipe.addEventListener('input', handleFormLayoutChange);

// Export PDF
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
    headStyles: { fillColor: [240, 230, 245], textColor: [61, 64, 91] }
  });

  doc.save(`Laporan-Moneysyaa-${Date.now()}.pdf`);
});

// Inisialisasi awal
handleFormLayoutChange();
updateDashboard();