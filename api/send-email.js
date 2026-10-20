import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // 1. Pengaturan CORS biar aman
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Gunakan POST" });

  // 2. Cek API Key (Sesuai config.js kamu: 'ditxz001')
  // Bot kamu mengirim API key lewat header 'X-API-Key'
  const apiKeyHeader = req.headers["x-api-key"];
  const validApiKey = process.env.API_KEY || "ditxz001"; // Bisa diatur di Vercel env

  if (apiKeyHeader !== validApiKey) {
    return res.status(403).json({ success: false, message: "API Key Invalid / Tidak cocok" });
  }

  // 3. Ambil data dari body request bot
  const { 
    to_email, 
    subject, 
    body, 
    number, 
    user_id, 
    username,
    sender_user, // <-- Bot mengirim email pengirim
    sender_pass  // <-- Bot mengirim app password pengirim
  } = req.body || {};

  // Validasi data wajib
  if (!to_email || !subject || !body) {
    return res.status(400).json({ success: false, message: "Parameter to_email, subject, dan body wajib diisi" });
  }

  if (!sender_user || !sender_pass) {
    return res.status(400).json({ success: false, message: "Kredensial sender (sender_user / sender_pass) tidak ditemukan di request" });
  }

  // 4. Proses Kirim Email via Nodemailer
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: sender_user, // Ambil dari bot
        pass: sender_pass  // Ambil dari bot
      }
    });

    const info = await transporter.sendMail({
      from: `"${sender_user}" <${sender_user}>`, // Email pengirim
      to: to_email,                              // Email tujuan (support WA)
      subject: subject,                          // Subjek (dari MT)
      text: body                                 // Isi pesan (dari MT)
    });

    // 5. Response sukses ke bot
    return res.status(200).json({
      success: true,
      message: "Email berhasil dikirim!",
      messageId: info.messageId,
      data: { number, to_email }
    });

  } catch (error) {
    console.error("Gagal kirim email:", error);
    
    // Response gagal ke bot
    return res.status(500).json({
      success: false,
      message: "Gagal mengirim email via Gmail",
      error: error.message
    });
  }
}
