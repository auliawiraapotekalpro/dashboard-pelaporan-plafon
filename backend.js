
// ==========================================
// CONFIGURATION
// ==========================================
const SPREADSHEET_ID = "1fcxDoBqRRNhZc2NmpgOs0HcURtNt6T7EnNcT7ryPSPc";
const DRIVE_ROOT_FOLDER_ID = "1VILFbKdKh46tJIZQ5JNqO3Oi16cKIe0E";

// Daftar email tambahan untuk pengawasan (Hardcoded CC)
const ADMIN_CC = "hendri@example.com, septian@example.com"; 

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const data = contents.data;
    const emailType = contents.emailType; 
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Ticket");

    if (action === "add") {
      const quota = MailApp.getRemainingDailyQuota();
      if (quota <= 0) throw new Error("LIMIT_EMAIL_TERCAPAI");

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
          
          if (emailType) {
            const quota = MailApp.getRemainingDailyQuota();
            if (quota <= 0) throw new Error("LIMIT_EMAIL_TERCAPAI");
          }

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
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function normalizeHeader(h) {
  const low = String(h).toLowerCase().trim();
  if (low === "id" || low.includes("id (") || low.includes("id tiket")) return "id";
  if (low.includes("tokoid") || (low.includes("toko") && low.includes("id"))) return "tokoId";
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
  if (low.includes("amemail") || (low.includes("am") && low.includes("email"))) return "amEmail";
  if (low.includes("email") && !low.includes("am")) return "email";
  return h;
}

function formatDateForEmail(d) {
  if (!d || d === '-') return '-';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return Utilities.formatDate(date, "GMT+7", "dd MMM yyyy");
  } catch(e) { return d; }
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
  const quota = MailApp.getRemainingDailyQuota();
  if (quota <= 0) throw new Error("LIMIT_EMAIL_TERCAPAI");

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

    // Cari data Toko untuk mendapatkan email Toko & AM
    const storeRow = dataRows.find(row => 
      String(row[idIdx]).trim().toLowerCase() === String(report.tokoId).trim().toLowerCase()
    );
    
    const storeEmail = storeRow && emailIdx !== -1 ? String(storeRow[emailIdx]).trim() : "";
    const amEmail = storeRow && amEmailIdx !== -1 ? String(storeRow[amEmailIdx]).trim() : "";
    
    // Ambil SEMUA email Admin dari sheet Users
    const adminEmails = dataRows
      .filter(row => String(row[roleIdx]).toUpperCase().includes("ADMIN"))
      .map(row => (emailIdx !== -1 ? String(row[emailIdx]).trim() : ""))
      .filter(e => e && e.includes("@"));

    // --- Kumpulkan Semua Penerima Menjadi Satu Jalur ---
    const allRecipients = [];
    if (storeEmail && storeEmail.includes("@")) allRecipients.push(storeEmail);
    if (amEmail && amEmail.includes("@")) allRecipients.push(amEmail);
    adminEmails.forEach(e => {
      if(e && !allRecipients.includes(e)) allRecipients.push(e);
    });

    if (allRecipients.length === 0) return;

    // Formatting Rekomendasi
    let formattedRecs = "";
    if (report.recommendation && report.recommendation !== "-") {
      formattedRecs = report.recommendation.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          if (line.includes(':')) {
            const parts = line.split(':');
            return `• ${parts[0].trim()}: ${parts.slice(1).join(':').trim()}`;
          }
          return `• ${line}`;
        }).join('\n');
    } else {
      formattedRecs = "-";
    }

    // Formatting Foto
    let photoSection = "";
    if (report.photoUrls && Array.isArray(report.photoUrls) && report.photoUrls.length > 0) {
      report.photoUrls.forEach((url, i) => { 
        if(url && url.startsWith('http')) photoSection += `   [>] Foto ${i + 1}:${url}\n`; 
      });
    } else { photoSection = "   (Tidak ada foto tersedia)"; }

    const separator = "==================================================";
    
    // --- Tentukan Intro dan Subjek Berdasarkan Tipe ---
    let intro = "";
    let subject = "";

    if (type === "NEW") {
      intro = `Halo, ada 1 ticket yang masuk dari ${report.tokoName} untuk perbaikan. Petugas akan segera melakukan pengecekan.`;
      subject = `[NEW TICKET] ${report.tokoName} - #${report.id}`;
    } else if (type === "SCHEDULED") {
      intro = "Halo, jadwal dan rencana pengerjaan untuk tiket ini telah diperbarui oleh Admin.";
      subject = `[JADWAL PENGERJAAN] ${report.tokoName} - #${report.id}`;
    } else if (type === "COMPLETED") {
      intro = "Kabar baik! Pekerjaan perbaikan plafon telah selesai dilaksanakan dan tiket kini ditutup.";
      subject = `[PENGERJAAN SELESAI] ${report.tokoName} - #${report.id}`;
    }

    // --- Susun Detail Block ---
    let detailBlock = `Informasi Tiket:
* ID Tiket	: ${report.id}
* Toko		: ${report.tokoName}
* Indikator	: ${report.indicator}
* Level Resiko	: ${report.riskLevel ? (report.riskLevel.includes(' - ') ? report.riskLevel.split(' - ')[1] : report.riskLevel) : "-"}
* Dampak Bisnis	: ${report.businessImpact || "-"}
* Rekomendasi	: ${formattedRecs}`;

    if (type === "SCHEDULED" || type === "COMPLETED") {
      detailBlock += `
* Departement	: ${report.department || "-"}
* PIC		: ${report.pic || "-"}
* Rencana tgl	: ${formatDateForEmail(report.plannedDate)}
* Target selesai: ${formatDateForEmail(report.targetDate)}`;
    }

    if (type === "COMPLETED") {
      detailBlock += `
* Berita Acara	: ${report.beritaAcara || "-"}`;
    }

    // --- Gabungkan Seluruh Isi Email ---
    const emailBody = `Yth. Rekan Terkait,

${intro}

${separator}
DETAIL LAPORAN PELAPORAN
${separator}

${detailBlock}

${separator}
BUKTI FOTO DOKUMENTASI
${separator}
${photoSection}

Silakan cek dashboard untuk detail lebih lanjut.

Terima kasih,
Sistem Maintenance Pelaporan Plafon`;

    // --- Kirim Satu Email Untuk Semua ---
    GmailApp.sendEmail(allRecipients.join(","), subject, emailBody, ADMIN_CC ? { cc: ADMIN_CC } : {});

  } catch (e) { 
    throw e; 
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
  } catch(err) { return createJsonResponse({status: "error", message: err.toString()}); }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
