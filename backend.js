
// ==========================================
// CONFIGURATION (WAJIB DIISI)
// ==========================================
const SPREADSHEET_ID = "1fcxDoBqRRNhZc2NmpgOs0HcURtNt6T7EnNcT7ryPSPc";
const DRIVE_ROOT_FOLDER_ID = "1VILFbKdKh46tJIZQ5JNqO3Oi16cKIe0E";

/**
 * FUNGSI 1: OTORISASI MANUAL & TEST (PENTING!)
 * Jalankan fungsi ini sekali di editor Apps Script (pilih di dropdown atas lalu klik 'Jalankan')
 * Ini untuk memberikan izin pengiriman email.
 */
function manualAuthorizeAndTest() {
  const emailUser = Session.getActiveUser().getEmail();
  const quota = MailApp.getRemainingDailyQuota();
  
  const subject = "🚀 Test Otorisasi Sistem Pelaporan Plafon";
  const body = `Halo!\n\nIzin pengiriman email telah aktif.\nSisa kuota pengiriman Anda hari ini: ${quota} email.\n\nJika Anda menerima email ini, sistem sudah SIAP digunakan.`;
  
  MailApp.sendEmail(emailUser, subject, body);
  Logger.log("Email test terkirim ke: " + emailUser + ". Sisa kuota: " + quota);
}

/**
 * FUNGSI 2: DO POST (Pintu masuk data dari Dashboard)
 */
function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const data = contents.data;
    const emailType = contents.emailType; // 'NEW', 'SCHEDULED', or 'COMPLETED'
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Ticket");

    if (action === "add") {
      // 1. Handle Foto (Upload ke Google Drive)
      const finalPhotoUrls = [];
      if (data.photoUrls && Array.isArray(data.photoUrls)) {
        data.photoUrls.forEach((base64, i) => {
          if (typeof base64 === 'string' && base64.startsWith('data:')) {
            const url = saveBase64ToDrive(base64, `Foto_${data.id}_${i+1}.jpg`, data.tokoName);
            finalPhotoUrls.push(url);
          } else {
            finalPhotoUrls.push(base64);
          }
        });
      }
      data.photoUrls = finalPhotoUrls;

      // 2. Simpan Baris Baru ke Sheet
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const newRow = headers.map(h => {
        if (h === 'photoUrls') return JSON.stringify(data.photoUrls);
        return data[h] !== undefined ? data[h] : "-";
      });
      sheet.appendRow(newRow);

      // 3. KIRIM EMAIL OTOMATIS
      sendProfessionalEmail(data, "NEW");

      return ContentService.createTextOutput(JSON.stringify({status: "success", id: data.id})).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "update") {
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const idIdx = headers.indexOf("id");
      
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idIdx]) === String(data.id)) {
          const rowNum = i + 1;
          headers.forEach((h, colIdx) => {
            if (data.hasOwnProperty(h)) {
              let val = data[h];
              if (h === 'photoUrls' && Array.isArray(val)) val = JSON.stringify(val);
              sheet.getRange(rowNum, colIdx + 1).setValue(val);
            }
          });
          
          // KIRIM EMAIL UPDATE (Jika ada pemicu emailType)
          if (emailType) sendProfessionalEmail(data, emailType);
          
          return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
  } catch (err) {
    Logger.log("Error doPost: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * FUNGSI 3: KIRIM EMAIL PROFESIONAL DENGAN POV BERBEDA
 */
function sendProfessionalEmail(report, type) {
  if (MailApp.getRemainingDailyQuota() < 1) {
    Logger.log("Gagal kirim: Kuota harian email habis.");
    return;
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const userSheet = ss.getSheetByName("Users");
    const userData = userSheet.getDataRange().getValues();
    const headers = userData.shift();
    
    const emailIdx = headers.indexOf("email");
    const roleIdx = headers.indexOf("role");
    const idIdx = headers.indexOf("id");

    const storeRow = userData.find(row => String(row[idIdx]).trim() === String(report.tokoId).trim());
    const storeEmail = storeRow ? storeRow[emailIdx] : "";
    const adminEmails = userData
      .filter(row => String(row[roleIdx]).toUpperCase().includes("ADMIN"))
      .map(row => row[emailIdx])
      .filter(e => e && e.includes("@"));

    // Hilangkan P1/P2/P3 dari Level Resiko
    const displayRisk = report.riskLevel.includes(" - ") ? report.riskLevel.split(" - ")[1] : report.riskLevel;

    // Build Foto List
    let fotoSection = "";
    if (report.photoUrls && Array.isArray(report.photoUrls)) {
      report.photoUrls.forEach((url, idx) => {
        fotoSection += `   [>] Foto ${idx + 1}:${url}\n`;
      });
    } else {
      fotoSection = "   (Tidak ada foto)\n";
    }

    // Detail Laporan (Bagian ini sama untuk semua POV)
    const detailLaporan = `
==================================================
DETAIL LAPORAN PELAPORAN
==================================================

Informasi Tiket:
* ID Tiket: ${report.id}
* Toko: ${report.tokoName}
* Indikator: ${report.indicator}
* Level Resiko: ${displayRisk}
* Dampak Bisnis: ${report.businessImpact}
* Rekomendasi: ${report.recommendation}`;

    // Detail Laporan dengan tambahan info Admin (untuk status SCHEDULED dan COMPLETED)
    const detailLaporanLengkap = `${detailLaporan}
* Departement: ${report.department || '-'}
* PIC: ${report.pic || '-'}
* Rencana tgl: ${report.plannedDate || '-'}
* Target selesai: ${report.targetDate || '-'}`;

    const footer = `

==================================================
BUKTI FOTO DOKUMENTASI
==================================================
${fotoSection}

Silakan cek dashboard untuk detail lebih lanjut.

Terima kasih,
Sistem Maintenance Pelaporan Plafon`;

    if (type === "NEW") {
      const subject = `[NEW] Pelaporan Perbaikan - ${report.tokoName} - #${report.id}`;
      
      // POV Pelapor (Toko)
      if (storeEmail) {
        const bodyStore = `Halo, Ticket anda berhasil di submit petugas akan segera menjadwalkan pengerjaan
${detailLaporan}${footer}`;
        MailApp.sendEmail(storeEmail, subject, bodyStore);
      }
      
      // POV Admin
      if (adminEmails.length > 0) {
        const bodyAdmin = `Halo, ada 1 Ticket pelaporan perbaikan dari ${report.tokoName}. mohon untuk di tindaklanjuti pengerjaan
${detailLaporan}${footer}`;
        MailApp.sendEmail(adminEmails.join(","), subject, bodyAdmin);
      }

    } else if (type === "SCHEDULED") {
      const subject = `[JADWAL] Pelaporan Perbaikan - ${report.tokoName} - #${report.id}`;
      
      // POV Pelapor (Toko)
      if (storeEmail) {
        const bodyStore = `Yth. Rekan Terkait,

Halo Tim Outlet, jadwal dan rencana pengerjaan untuk tiket Anda telah
diperbarui oleh Admin.
${detailLaporanLengkap}${footer}`;
        MailApp.sendEmail(storeEmail, subject, bodyStore);
      }

      // POV Admin
      if (adminEmails.length > 0) {
        const bodyAdmin = `Halo Tim Petugas ticket sudah berhasil dalam penjadwalan
${detailLaporanLengkap}${footer}`;
        MailApp.sendEmail(adminEmails.join(","), subject, bodyAdmin);
      }

    } else if (type === "COMPLETED") {
      const subject = `[DONE] Perbaikan Selesai - ${report.tokoName} - #${report.id}`;
      const body = `Yth. Rekan Terkait,

Kabar baik! Pekerjaan perbaikan plafon telah selesai dilaksanakan dan tiket kini ditutup.
${detailLaporanLengkap}${footer}`;

      const allRecipients = [];
      if (storeEmail) allRecipients.push(storeEmail);
      adminEmails.forEach(e => { if(!allRecipients.includes(e)) allRecipients.push(e); });
      
      if (allRecipients.length > 0) {
        MailApp.sendEmail(allRecipients.join(","), subject, body);
      }
    }

    Logger.log("Email berhasil diproses untuk type: " + type);
  } catch (e) {
    Logger.log("Gagal kirim email: " + e.message);
  }
}

/**
 * FUNGSI 4: SIMPAN FOTO KE GOOGLE DRIVE
 */
function saveBase64ToDrive(base64Data, fileName, shopName) {
  try {
    const rootFolder = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
    let shopFolder;
    const folders = rootFolder.getFoldersByName(shopName);
    if (folders.hasNext()) shopFolder = folders.next();
    else shopFolder = rootFolder.createFolder(shopName);
    
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(bytes, "image/jpeg", fileName);
    const file = shopFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch(e) {
    Logger.log("Error save photo: " + e.message);
    return "error-upload";
  }
}

/**
 * FUNGSI 5: DO GET (Ambil Data untuk Frontend)
 */
function doGet(e) {
  const sheetName = e.parameter.sheet || "Ticket";
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) return createJsonResponse({error: "Sheet not found"});

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data.shift();
  const json = data.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let val = row[i];
      if (header === 'photoUrls' && typeof val === 'string' && val.startsWith('[')) {
        try { val = JSON.parse(val); } catch(e) { val = [val]; }
      }
      obj[header] = val;
    });
    return obj;
  });

  return createJsonResponse(json);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
