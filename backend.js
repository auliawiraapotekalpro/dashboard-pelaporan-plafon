
// ==========================================
// CONFIGURATION
// ==========================================
const SPREADSHEET_ID = "1fcxDoBqRRNhZc2NmpgOs0HcURtNt6T7EnNcT7ryPSPc";
const DRIVE_ROOT_FOLDER_ID = "1VILFbKdKh46tJIZQ5JNqO3Oi16cKIe0E";

// Daftar email tambahan untuk pengawasan (pisahkan dengan koma)
const ADMIN_CC = "hendri@example.com,septian@example.com";

/**
 * Fungsi untuk testing manual di editor GAS guna memicu izin email
 */
function testEmail() {
  const testData = {
    id: "TKT-1322",
    tokoId: "toko-1",
    tokoName: "APOTEK ALPRO BANGBARUNG RAYA",
    indicator: "Plafon roboh di area publik/apoteker, kabel terbakar, atau bocor tepat di atas stok obat mahal/kulkas vaksin.",
    riskLevel: "P1 - CRITICAL",
    businessImpact: "Operasional berhenti sebagian/total, risiko cedera manusia, kerugian stok masif.",
    recommendation: "Perbaikan darurat sumber kebocoran dan penggantian total plafon yang roboh.",
    photoUrls: []
  };
  
  // Cek Kuota Sebelum Test
  const quota = MailApp.getRemainingDailyQuota();
  console.log("Sisa Kuota Email Hari Ini: " + quota);
  
  if (quota > 0) {
    sendProfessionalEmail(testData, "NEW");
    console.log("Email test dikirim. Silakan cek folder 'Terkirim' di Gmail Anda.");
  } else {
    console.error("Gagal: Kuota email harian Anda sudah habis (0). Silakan tunggu 24 jam.");
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const data = contents.data;
    const emailType = contents.emailType; 
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Ticket");

    if (action === "add") {
      const finalPhotoUrls = [];
      if (data.photoUrls && Array.isArray(data.photoUrls)) {
        data.photoUrls.forEach((base64, i) => {
          if (typeof base64 === 'string' && base64.startsWith('data:')) {
            const fileName = `IMG_${data.id}_${i + 1}_${new Date().getTime()}.jpg`;
            const url = saveBase64ToDrive(base64, fileName, data.tokoName);
            finalPhotoUrls.push(url);
          } else {
            finalPhotoUrls.push(base64);
          }
        });
      }
      data.photoUrls = finalPhotoUrls;

      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const cleanHeaders = headers.map(h => normalizeHeader(h));
      
      const newRow = cleanHeaders.map(h => {
        if (h === 'photoUrls') return JSON.stringify(data.photoUrls);
        if (data.hasOwnProperty(h)) return data[h];
        return "-";
      });
      sheet.appendRow(newRow);

      // KIRIM EMAIL OTOMATIS
      sendProfessionalEmail(data, "NEW");
      
      return ContentService.createTextOutput(JSON.stringify({status: "success", id: data.id})).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "update") {
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const cleanHeaders = headers.map(h => normalizeHeader(h));
      const idIdx = cleanHeaders.indexOf("id");
      
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idIdx]).trim().toUpperCase() === String(data.id).trim().toUpperCase()) {
          const rowNum = i + 1;
          cleanHeaders.forEach((h, colIdx) => {
            if (data.hasOwnProperty(h)) {
              let val = data[h];
              if (h === 'photoUrls' && Array.isArray(val)) val = JSON.stringify(val);
              sheet.getRange(rowNum, colIdx + 1).setValue(val);
            }
          });
          
          if (emailType) sendProfessionalEmail(data, emailType);
          return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
  } catch (err) {
    console.error("Error di doPost: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function normalizeHeader(h) {
  const low = String(h).toLowerCase().trim();
  if (low === "id" || low.includes("id (") || low.includes("id tiket")) return "id";
  if (low.includes("tokoid")) return "tokoId";
  if (low.includes("tokoname") || low.includes("nama toko")) return "tokoName";
  if (low.includes("status")) return "status";
  if (low.includes("planneddate") || low.includes("rencana")) return "plannedDate";
  if (low.includes("targetdate") || low.includes("target")) return "targetDate";
  if (low.includes("completiondate") || low.includes("tgl selesai")) return "completionDate";
  if (low === "date" || low === "tanggal" || low.includes("tgl lapor")) return "date";
  if (low.includes("indicator") || low.includes("indikator")) return "indicator";
  if (low.includes("risklevel") || low.includes("resiko")) return "riskLevel";
  if (low.includes("businessimpact") || low.includes("dampak bisnis")) return "businessImpact";
  if (low.includes("recommendation") || low.includes("rekomendasi")) return "recommendation";
  if (low.includes("photourls") || low.includes("foto drive")) return "photoUrls";
  if (low.includes("department") || low.includes("dept")) return "department";
  if (low.includes("pic")) return "pic";
  if (low.includes("beritaacara") || low.includes("work report")) return "beritaAcara";
  if (low.includes("password")) return "password";
  if (low.includes("role")) return "role";
  if (low.includes("amname")) return "amName";
  if (low.includes("amemail")) return "amEmail";
  if (low.includes("email") && !low.includes("am")) return "email";
  return h;
}

function saveBase64ToDrive(base64Data, fileName, shopName) {
  try {
    const rootFolder = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
    const cleanedShopName = String(shopName).trim().toUpperCase();
    let shopFolder;
    const folders = rootFolder.getFoldersByName(cleanedShopName);
    if (folders.hasNext()) shopFolder = folders.next();
    else shopFolder = rootFolder.createFolder(cleanedShopName);
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(bytes, "image/jpeg", fileName);
    const file = shopFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch(e) { return "error-upload"; }
}

function sendProfessionalEmail(report, type) {
  // 1. CEK KUOTA HARIAN TERLEBIH DAHULU
  const quota = MailApp.getRemainingDailyQuota();
  if (quota <= 0) {
    console.error("Gagal kirim email: Kuota harian Google sudah habis.");
    return; // Keluar dari fungsi agar tidak error 'Too many times'
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const userSheet = ss.getSheetByName("Users");
    const userData = userSheet.getDataRange().getValues();
    const headers = userData[0].map(h => normalizeHeader(h));
    const dataRows = userData.slice(1);

    const idIdx = headers.indexOf("id");
    const roleIdx = headers.indexOf("role");
    const emailIdx = headers.indexOf("email");
    const amEmailIdx = headers.indexOf("amEmail");

    // FIX: Gunakan storeRow yang benar
    const storeRow = dataRows.find(row => 
      String(row[idIdx]).trim().toLowerCase() === String(report.tokoId).trim().toLowerCase()
    );
    
    const storeEmail = storeRow && emailIdx !== -1 ? String(storeRow[emailIdx]).trim() : "";
    const amEmail = storeRow && amEmailIdx !== -1 ? String(storeRow[amEmailIdx]).trim() : "";
    
    const adminEmails = dataRows
      .filter(row => String(row[roleIdx]).toUpperCase().includes("ADMIN"))
      .map(row => (emailIdx !== -1 ? String(row[emailIdx]).trim() : ""))
      .filter(e => e && e.includes("@"));

    const separator = "==================================================";
    
    let photoSection = "";
    if (report.photoUrls && Array.isArray(report.photoUrls) && report.photoUrls.length > 0) {
      report.photoUrls.forEach((url, i) => { 
        if(url && url.startsWith('http')) photoSection += `   [>] Foto ${i + 1}: ${url}\n`; 
      });
    } else { photoSection = "   (Tidak ada foto tersedia)"; }

    let detailInfoList = `* ID Tiket   : ${report.id}
* Toko       : ${report.tokoName}
* Indikator  : ${report.indicator}`;

    if (type === "NEW") {
      detailInfoList += `\n* Resiko     : ${report.riskLevel}\n* Dampak     : ${report.businessImpact}`;
    }

    if (type === "SCHEDULED" || type === "COMPLETED") {
      detailInfoList += `\n* Dept       : ${report.department || "-"}\n* PIC        : ${report.pic || "-"}\n* Rencana    : ${report.plannedDate || "-"}\n* Target     : ${report.targetDate || "-"}`;
    }

    if (type === "COMPLETED") {
      detailInfoList += `\n* Berita Acara: ${report.beritaAcara || "-"}`;
    }

    const introText = type === "NEW" 
      ? "Halo, laporan kebocoran baru telah diterima. Petugas akan segera melakukan pengecekan."
      : "Halo, ada pembaruan status pada laporan kebocoran Anda.";

    const emailBody = `Yth. Rekan Terkait,

${introText}

${separator}
DETAIL LAPORAN PELAPORAN
${separator}

Informasi Tiket:
${detailInfoList}

${separator}
BUKTI FOTO DOKUMENTASI
${separator}
${photoSection}

Silakan cek dashboard untuk detail lebih lanjut.

Terima kasih,
Sistem Maintenance Pelaporan Plafon`;

    let subject = "";
    if (type === "NEW") subject = `[TICKET DITERIMA] ${report.tokoName} - #${report.id}`;
    else if (type === "SCHEDULED") subject = `[JADWAL PENGERJAAN] ${report.tokoName} - #${report.id}`;
    else if (type === "COMPLETED") subject = `[PENGERJAAN SELESAI] ${report.tokoName} - #${report.id}`;

    const recipients = [];
    if (storeEmail && storeEmail.includes("@")) recipients.push(storeEmail);
    if (amEmail && amEmail.includes("@")) recipients.push(amEmail);
    
    if (type === "NEW") {
       adminEmails.forEach(e => { if(e && !recipients.includes(e)) recipients.push(e); });
    }

    // Eksekusi pengiriman hanya jika ada penerima
    if (recipients.length > 0) {
      GmailApp.sendEmail(recipients.join(","), subject, emailBody, { cc: ADMIN_CC });
    } else if (adminEmails.length > 0) {
      GmailApp.sendEmail(adminEmails.join(","), subject, emailBody, { cc: ADMIN_CC });
    }

  } catch (e) { 
    console.error("Gagal kirim email: " + e.message); 
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetName = e.parameter.sheet || "Ticket";
    const sheet = ss.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse([]);
    
    const rawHeaders = data.shift();
    const cleanHeaders = rawHeaders.map(h => normalizeHeader(h));
    const json = data.map(row => {
      const obj = {};
      cleanHeaders.forEach((header, i) => {
        let val = row[i];
        if (header === 'photoUrls' && typeof val === 'string' && (val.startsWith('[') || val.startsWith('http'))) {
          try { if(val.startsWith('[')) val = JSON.parse(val); else val = [val]; } catch(e) { val = [val]; }
        }
        obj[header] = val;
      });
      return obj;
    });
    return createJsonResponse(json);
  } catch(err) { return createJsonResponse({error: err.toString()}); }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
