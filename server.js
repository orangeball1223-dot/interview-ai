import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import multer from "multer"
import { PDFParse } from "pdf-parse"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
})

async function askGroq(messages) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    console.error(data)
    throw new Error("Groqとの通信に失敗しました")
  }

  return data.choices[0].message.content
}
app.post("/api/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "PDFが選択されていません",
      })
    }

    const parser = new PDFParse({
      data: req.file.buffer,
    })

    const result = await parser.getText()
    await parser.destroy()

    res.json({
      fileName: req.file.originalname,
      text: result.text,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: "PDFの読み取りに失敗しました",
    })
  }
})

app.post("/api/analyze-profile", async (req, res) => {
  try {
    const { pdfText } = req.body

    const text = await askGroq([
      {
        role: "system",
        content:
          "あなたは履歴書・職務経歴書の解析AIです。入力された文章から、職歴、現在の仕事内容、実績、強み、弱み、志望職種、転職理由を整理してください。書かれていない内容は推測せず空欄にしてください。必ずJSONだけで返してください。",
      },
      {
        role: "user",
        content: `以下の履歴書・職務経歴書を解析してください。

${pdfText}

次のJSON形式だけで返してください。

{
  "career": "",
  "currentJob": "",
  "achievements": "",
  "strengths": "",
  "weaknesses": "",
  "desiredJob": "",
  "reason": ""
}`,
      },
    ])

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const profile = JSON.parse(cleanedText)

    res.json(profile)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: "プロフィール解析に失敗しました",
    })
  }
})

app.post("/api/analyze-job", async (req, res) => {
  try {
    const { pdfText } = req.body

    const companyInfo = await askGroq([
      {
        role: "system",
        content:
          "あなたは求人票を整理するAIです。求人票の内容から、会社情報、仕事内容、必須条件、歓迎条件、求める人物像、特徴を分かりやすく整理してください。書かれていない内容は推測しないでください。",
      },
      {
        role: "user",
        content: `以下の求人票を整理してください。

${pdfText}`,
      },
    ])

    res.json({
      companyInfo,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: "求人票の解析に失敗しました",
    })
  }
})
app.post("/api/interview", async (req, res) => {
  try {
    const { text, profile = {} } = req.body

    const profileText = `
職歴: ${profile.career || ""}
現在の仕事内容: ${profile.currentJob || ""}
実績: ${profile.achievements || ""}
強み: ${profile.strengths || ""}
弱み: ${profile.weaknesses || ""}
志望職種: ${profile.desiredJob || ""}
転職理由: ${profile.reason || ""}
志望企業: ${profile.company || ""}
企業情報: ${profile.companyInfo || ""}
企業URL: ${profile.companyUrl || ""}
`

    const answer = await askGroq([
      {
        role: "system",
        content:
          "あなたは転職面接の回答アシスタントです。求職者のプロフィールと企業情報を参考に、面接官の質問へ本人がそのまま話せる自然な日本語で回答してください。回答は10秒程度で話せる長さにして、結論から簡潔に答えてください。登録されていない経歴や実績は絶対に作らないでください。"
      },
      {
        role: "user",
        content: `【求職者情報】
${profileText}

【面接官の質問】
${text}`,
      },
    ])

    res.json({
      answer,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: "AIとの通信に失敗しました",
    })
  }
})

app.listen(3001, () => {
  console.log("AIサーバー起動: http://localhost:3001")
})