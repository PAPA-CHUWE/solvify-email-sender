import express, { Request, Response } from "express"
import cors from "cors"
import dotenv from "dotenv"
import { Resend } from "resend"
import { connectDB } from "./db/dbCon"
import LeadModel from "./model/Lead"


dotenv.config()

const app = express()

// --- Middleware
app.use(express.json())

// If your frontend is on another domain (static site), enable CORS:
const allowedOrigin =  "*"
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
)

const resend = new Resend(process.env.RESEND_API_KEY)

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, message: "API is running" })
})

// Contact endpoint
app.post("/api/contact", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, service, website } = req.body ?? {}

    // Honeypot (bots fill this)
    if (website) return res.status(200).json({ ok: true })

    if (!name || !phone || !service) {
      return res.status(400).json({ ok: false, error: "Missing required fields" })
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ ok: false, error: "Invalid email address" })
    }

    // Save to MongoDB
    const lead = await LeadModel.create({
      name: String(name),
      email: String(email || ""),
      phone: String(phone),
      service: String(service),
      source: "website",
      userAgent: String(req.headers["user-agent"] || ""),
      ip: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || ""),
    })

    const to = process.env.CONTACT_TO_EMAIL || "terrence.c@solvifytech.co.zw"
    const cc = process.env.CONTACT_CC_EMAIL || "info@solvifytech.co.zw"
    const from = "info@solvifytech.co.zw"
      ? `Solvify Technologies <solvifytech.co.zw>`
      : "Solvify Technologies <solvifytech.co.zw>"

    const subject = `New lead: ${service} — ${name}`

    const { error } = await resend.emails.send({
      from,
      to: [to],
      cc: [cc],
      replyTo: email || cc,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>New Website Lead</h2>
          <p><strong>Name:</strong> ${escapeHtml(String(name))}</p>
          <p><strong>Email:</strong> ${escapeHtml(String(email || "—"))}</p>
          <p><strong>Phone:</strong> ${escapeHtml(String(phone))}</p>
          <p><strong>Service:</strong> ${escapeHtml(String(service))}</p>
          <hr/>
          <p style="color:#666;font-size:12px">Lead ID: ${lead._id}</p>
        </div>
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return res.status(500).json({ ok: false, error: "Email send failed.", leadId: lead._id })
    }

    return res.status(200).json({ ok: true, leadId: lead._id })
  } catch (err) {
    console.error("Contact API error:", err)
    return res.status(500).json({ ok: false, error: "Server error" })
  }
})

function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}


// Boot
const port = Number(process.env.PORT || 3000)

connectDB(process.env.MONGODB_URI || "")
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ Listening on http://localhost:${port}`)
    })
  })
  .catch((e) => {
    console.error("❌ Failed to connect DB:", e)
    process.exit(1)
  })
