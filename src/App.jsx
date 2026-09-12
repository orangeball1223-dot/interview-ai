import { useState } from 'react'
import { jsPDF } from 'jspdf'

function App() {
  const [page, setPage] = useState('profile')
  const [question, setQuestion] = useState('')
const [answer, setAnswer] = useState('')
const [status, setStatus] = useState('待機中')
const [history, setHistory] = useState([])

  const [profile, setProfile] = useState({
    career: '',
    currentJob: '',
    achievements: '',
    strengths: '',
    weaknesses: '',
    desiredJob: '',
    reason: '',
    company: '',
    companyInfo: '',
    companyUrl: '',
  })

  const updateProfile = (key, value) => {
    setProfile({
      ...profile,
      [key]: value,
    })
  }

  if (page === 'review') {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>面接の振り返り</h1>

        {history.length === 0 ? (
          <p>まだ面接履歴がありません。</p>
        ) : (
          history.map((item, index) => (
            <div key={index} style={styles.answerBox}>
              <h3>Q{index + 1} 面接官の質問</h3>
              <p>{item.question}</p>

              <h3>AIおすすめ回答</h3>
              <p>{item.answer}</p>
            </div>
          ))
        )}

        <button
          style={styles.mainButton}
          onClick={() => setPage('profile')}
        >
          <button
  style={styles.mainButton}
  onClick={() => window.print()}
>
  PDFで保存
</button>
          プロフィールに戻る
        </button>
      </div>
    </div>
  )
}
  if (page === 'interview') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>🎤 リアルタイム面接AI</h1>

          <p style={styles.subTitle}>
            面接官の質問を聞いて、AIが回答カンペを生成します。
          </p>

          <button
            style={styles.mainButton}
            onClick={() => setPage('profile')}
          >
            ← プロフィールに戻る
          </button>
          <button
  style={styles.mainButton}
  onClick={() => setPage('review')}
>
  面接を終了して振り返る
</button>

          <hr />

          <h2>面接画面</h2>

          <div style={styles.questionBox}>
            <h3>面接官の質問</h3>
            <p>{question || 'ここに音声認識した質問が表示されます。'}</p>
          </div>

          <div style={styles.answerBox}>
            <h3>🤖 AI回答おすすめ回答</h3>
            <p>{answer || 'ここにAI回答が表示されます。'}</p>
          </div>

          <button
  style={styles.mainButton}
  onClick={() => {
    alert('ボタン押せた！')
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('このブラウザでは音声認識が使えません')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript
      setQuestion(text)

      try {
        const response = await fetch('http://localhost:3001/api/interview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            profile,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(data.error || 'AI回答の生成に失敗しました')
          return
        }

        setAnswer(data.answer)
setStatus('回答できました')
setHistory((prev) => [
  ...prev,
  {
    question: text,
    answer: data.answer,
  },
])
} catch (error) {
        console.error(error)
        alert('AIとの通信に失敗しました')
      }
    }

    recognition.start()
  }}
>
  🎤 音声認識を開始
</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>面接AI</h1>

        <p style={styles.subTitle}>
          あなた専用のリアルタイム面接アシスタント
        </p>

        <h2>📄 STEP 1｜履歴書・職務経歴書</h2>

        <div style={styles.uploadBox}>
          <p>📎 履歴書・職務経歴書をアップロード</p>
          <label style={{ display: 'inline-block', padding: '12px 20px', background: '#111827', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
  📎 PDFを選択
  <input
    type="file"
    accept=".pdf"
    style={{ display: 'none' }}
    onChange={async (e) => {
  const file = e.target.files[0]

  if (!file) return

  const formData = new FormData()
  formData.append('pdf', file)

  try {
    const response = await fetch('http://localhost:3001/api/pdf', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      alert(data.error || 'PDFの読み取りに失敗しました')
      return
    }

    const analyzeResponse = await fetch('http://localhost:3001/api/analyze-profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    pdfText: data.text,
  }),
})

const analyzedProfile = await analyzeResponse.json()

if (!analyzeResponse.ok) {
  alert(analyzedProfile.error || 'プロフィール解析に失敗しました')
  return
}

setProfile((prev) => ({
  ...prev,
  ...analyzedProfile,
}))
alert('PDFの内容をプロフィールに反映しました！')
} catch (error) {
    alert('PDFサーバーとの通信に失敗しました')
  }
}}
  />
</label>
          <p style={styles.smallText}>
            ※ PDF機能はこれから追加します
          </p>
        </div>

        <h2>✏️ STEP 2｜あなたについて</h2>

        <label>職歴</label>
        <textarea
          placeholder="これまでの職歴を入力してください"
          value={profile.career}
          onChange={(e) => updateProfile('career', e.target.value)}
        />

        <label>現在の仕事内容</label>
        <textarea
          placeholder="現在どのような仕事をしていますか？"
          value={profile.currentJob}
          onChange={(e) => updateProfile('currentJob', e.target.value)}
        />

        <label>実績</label>
        <textarea
          placeholder="仕事で達成したこと、数字で表せる実績など"
          value={profile.achievements}
          onChange={(e) =>
            updateProfile('achievements', e.target.value)
          }
        />

        <label>強み</label>
        <textarea
          placeholder="あなたの強みを入力してください"
          value={profile.strengths}
          onChange={(e) => updateProfile('strengths', e.target.value)}
        />

        <label>弱み</label>
        <textarea
          placeholder="あなたの弱みを入力してください"
          value={profile.weaknesses}
          onChange={(e) =>
            updateProfile('weaknesses', e.target.value)
          }
        />

        <label>志望職種</label>
        <input
          placeholder="例：法人営業"
          value={profile.desiredJob}
          onChange={(e) =>
            updateProfile('desiredJob', e.target.value)
          }
        />

        <label>転職理由</label>
        <textarea
          placeholder="転職を考えた理由を入力してください"
          value={profile.reason}
          onChange={(e) => updateProfile('reason', e.target.value)}
        />

        <h2>🏢 STEP 3｜選考企業</h2>
<label style={{ display: 'block', marginTop: '20px' }}>
  求人票PDF
</label>

<label
  style={{
    display: 'inline-block',
    padding: '12px 20px',
    background: '#111827',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
  }}
>
  📄 求人票PDFを選択

  <input
  type="file"
  accept=".pdf"
  style={{ display: 'none' }}
  onChange={async (e) => {
    const file = e.target.files[0]

    if (!file) return

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const response = await fetch('http://localhost:3001/api/pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '求人票PDFの読み取りに失敗しました')
        return
      }

      const analyzeResponse = await fetch('http://localhost:3001/api/analyze-job', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    pdfText: data.text,
  }),
})

const analyzedJob = await analyzeResponse.json()

if (!analyzeResponse.ok) {
  alert(analyzedJob.error || '求人票の解析に失敗しました')
  return
}

setProfile((prev) => ({
  ...prev,
  companyInfo: analyzedJob.companyInfo,
}))

alert('求人票の内容を企業情報に反映しました！')
      
    } catch (error) {
      console.error(error)
      alert('求人票PDFサーバーとの通信に失敗しました')
    }
  }}
/>
</label>
        <label>志望企業</label>
        
        <input
          placeholder="例：株式会社〇〇"
          value={profile.company}
          onChange={(e) => updateProfile('company', e.target.value)}
        />

        <label>企業情報</label>
        <textarea
          placeholder="企業理念、仕事内容、求人内容、求める人物像などを入力してください"
          value={profile.companyInfo}
          onChange={(e) =>
            updateProfile('companyInfo', e.target.value)
          }
        />

        <label>企業HP・求人ページURL</label>
        <input
          placeholder="https://..."
          value={profile.companyUrl}
          onChange={(e) =>
            updateProfile('companyUrl', e.target.value)
          }
        />

        <button
          style={styles.startButton}
          onClick={() => setPage('interview')}
        >
          面接を開始する →
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif',
  },

  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },

  subTitle: {
    color: '#666',
    marginBottom: '35px',
  },

  uploadBox: {
    border: '2px dashed #bbb',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    marginBottom: '35px',
  },

  smallText: {
    fontSize: '12px',
    color: '#888',
  },

  questionBox: {
    background: '#f5f7fa',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '20px',
  },

  answerBox: {
    background: '#eef7ff',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '25px',
  },

  mainButton: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
  },

  startButton: {
    width: '100%',
    padding: '16px',
    marginTop: '30px',
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    cursor: 'pointer',
  },
}

export default App