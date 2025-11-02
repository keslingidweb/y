/* script.js - versi offline (non-module) untuk CTPS Quiz
   - Pastikan Firebase compat (firebase-app-compat + firebase-database-compat) dimuat dulu di index.html
   - Fungsi: timer 10s/soal, input nama wajib, simpan ke Realtime DB, leaderboard realtime,
     ranking (score desc, time asc), tampil rata-rata waktu, fallback localStorage.
*/

/* ========== CONFIG FIREBASE ========== */
/* Ganti kalau perlu, ini sesuai config yang sudah kamu berikan */
const firebaseConfig = {
  apiKey: "AIzaSyAOERI5Ht7Qk7jrKFr1iY2nI0G3LxIg46U",
  authDomain: "cuci-tangan-pakai-sabun.firebaseapp.com",
  databaseURL: "https://cuci-tangan-pakai-sabun-default-rtdb.firebaseio.com/",
  projectId: "cuci-tangan-pakai-sabun",
  storageBucket: "cuci-tangan-pakai-sabun.firebasestorage.app",
  messagingSenderId: "889628313975",
  appId: "1:889628313975:web:698fc8513c7ed57ec73972",
  measurementId: "G-1TM1M44LZ5"
};

// Initialize Firebase (compat style)
try {
  if (typeof firebase === 'undefined' || !firebase.apps) {
    console.warn('Firebase script belum dimuat! Pastikan CDN Firebase dimuat sebelum script ini.');
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  var db = firebase.database();
} catch (err) {
  console.error('Inisialisasi Firebase gagal:', err);
  db = null;
}

/* ========== Helper DOM references ========== */
document.getElementById('year').textContent = new Date().getFullYear();

const simBtn = document.getElementById("simBtn");
const simProgress = document.getElementById("simProgress");
const simTime = document.getElementById("simTime");

const qEl = document.getElementById('question');
const optEl = document.getElementById('options');
const startBtn = document.getElementById('startQuizBtn');
const restartBtn = document.getElementById('restartQuizBtn');
const timerEl = document.getElementById('timerNum');
const chartEl = document.getElementById('scoreChart');
const resultSummary = document.getElementById('resultSummary');
const leaderboardWrap = document.getElementById('leaderboardWrap');
const playerNameInput = document.getElementById('playerName');
const confirmNameBtn = document.getElementById('confirmNameBtn');
const nameWarn = document.getElementById('nameWarn');
const playerEntry = document.getElementById('playerEntry');

/* ========== Sounds (optional) ========== */
const simStartSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
const simTickSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
const simEndSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
const soundCorrect = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const soundWrong = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const soundFinish = new Audio("https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_hit.ogg");

/* ========== Quiz data (20 soal) ========== */
const quiz = [
  { q: "Apa kepanjangan dari CTPS?", opts: ["Cuci Tangan Pakai Sabun", "Cuci Tubuh Pakai Sabun", "Cuci Tangan Pagi Siang", "Cuci Tangan Pakai Sikat"], a: 0 },
  { q: "Tujuan utama CTPS adalah untuk…", opts: ["Mengharumkan tangan", "Menghilangkan kotoran dan kuman", "Menyegarkan tubuh", "Membuat tangan lembut"], a: 1 },
  { q: "Berapa lama waktu ideal mencuci tangan menurut WHO?", opts: ["5 detik", "10 detik", "20 detik", "1 menit"], a: 2 },
  { q: "CTPS termasuk perilaku hidup bersih di lingkungan…", opts: ["Rumah", "Sekolah", "Masyarakat", "Semua benar"], a: 3 },
  { q: "CTPS dapat mencegah penyakit berikut, kecuali…", opts: ["Diare", "Tifus", "Flu", "Sakit mata karena kurang tidur"], a: 3 },
  { q: "Langkah pertama mencuci tangan adalah…", opts: ["Gunakan sabun", "Basahi tangan dengan air bersih", "Keringkan tangan", "Gosok punggung tangan"], a: 1 },
  { q: "Kapan sebaiknya mencuci tangan?", opts: ["Setelah makan", "Sebelum tidur", "Sebelum makan dan setelah dari toilet", "Setelah bermain"], a: 2 },
  { q: "CTPS adalah bagian dari program…", opts: ["PHBS", "K3", "UKS", "CSR"], a: 0 },
  { q: "Apa yang dibutuhkan untuk CTPS?", opts: ["Air bersih dan sabun", "Air saja", "Tisu basah", "Parfum tangan"], a: 0 },
  { q: "Berapa pilar dalam program STBM?", opts: ["3", "4", "5", "6"], a: 2 },
  { q: "CTPS merupakan pilar keberapa dalam STBM?", opts: ["1", "2", "3", "4"], a: 3 },
  { q: "Apa yang harus dilakukan setelah mencuci tangan?", opts: ["Mengeringkan dengan handuk bersih", "Membiarkan basah", "Mengibaskan", "Mengusap ke baju"], a: 0 },
  { q: "Waktu minimal mencuci tangan agar efektif adalah…", opts: ["10 detik", "15 detik", "20 detik", "30 detik"], a: 2 },
  { q: "Kuman paling banyak menempel di bagian…", opts: ["Telapak tangan", "Punggung tangan", "Sela jari", "Semua benar"], a: 3 },
  { q: "CTPS dapat menurunkan risiko diare hingga…", opts: ["10%", "25%", "40%", "60%"], a: 2 },
  { q: "Mengapa sabun penting saat mencuci tangan?", opts: ["Membunuh virus dan bakteri", "Membuat wangi", "Menghaluskan kulit", "Mendinginkan tangan"], a: 0 },
  { q: "Siapa yang dianjurkan melakukan CTPS?", opts: ["Anak-anak", "Orang dewasa", "Lansia", "Semua umur"], a: 3 },
  { q: "Kapan waktu penting untuk CTPS?", opts: ["Sebelum makan dan setelah BAB", "Saat lapar", "Setelah tidur", "Sebelum minum"], a: 0 },
  { q: "Manfaat CTPS bagi masyarakat adalah…", opts: ["Mencegah penularan penyakit", "Menambah berat badan", "Meningkatkan nafsu makan", "Menghemat air"], a: 0 },
  { q: "Apa yang dilakukan jika tidak ada sabun?", opts: ["Gunakan hand sanitizer", "Gunakan parfum", "Tidak usah cuci tangan", "Gunakan air saja"], a: 0 }
];

/* ========== State variables ========== */
let cur = 0, score = 0, quizTimer = null;
const timePerQuestion = 10;
let startedAt = null, finishedAt = null;
let playerName = null;

/* ========== Local persistence keys ========== */
const LOCAL_RESULTS_KEY = 'ctps_local_results';
const LOCAL_SCORES_KEY = 'ctpsScores';

/* ========== UI helpers ========== */
function setStartState(enabled) {
  startBtn.disabled = !enabled;
}
setStartState(false);

confirmNameBtn.addEventListener('click', () => {
  const v = (playerNameInput.value || '').trim();
  if (!v) {
    nameWarn.style.display = 'block';
    return;
  }
  nameWarn.style.display = 'none';
  playerName = v;
  playerEntry.style.display = 'none';
  setStartState(true);
});

playerNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmNameBtn.click();
});

/* tiny shake animation helper */
(function addShakeAnimation() {
  const styleShake = document.createElement('style');
  styleShake.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%,60% { transform: translateX(-8px); }
      40%,80% { transform: translateX(8px); }
    }`;
  document.head.appendChild(styleShake);
})();

function shakeElement(el) {
  if (!el) return;
  el.style.animation = 'shake 0.4s';
  el.addEventListener('animationend', () => (el.style.animation = ''), { once: true });
}

/* ========== Render & quiz logic ========== */
function renderQuiz() {
  chartEl.style.display = 'none';
  resultSummary.innerHTML = '';
  leaderboardWrap.innerHTML = '';
  if (cur >= quiz.length) {
    finishQuiz();
    return;
  }
  const q = quiz[cur];
  qEl.textContent = q.q;
  optEl.innerHTML = '';
  q.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.textContent = o;
    b.onclick = () => ans(i, b);
    optEl.appendChild(b);
  });

  clearInterval(quizTimer);
  let time = timePerQuestion;
  timerEl.textContent = time;
  quizTimer = setInterval(() => {
    time--;
    timerEl.textContent = time;
    if (time <= 0) {
      clearInterval(quizTimer);
      cur++;
      renderQuiz();
    }
  }, 1000);
}

function ans(i, b) {
  clearInterval(quizTimer);
  const cor = quiz[cur].a;
  const all = optEl.querySelectorAll('button');
  all.forEach(btn => btn.disabled = true);
  if (i === cor) {
    b.classList.add('correct');
    score++;
    try { soundCorrect.currentTime = 0; soundCorrect.play(); } catch(e){}
  } else {
    b.classList.add('wrong');
    if (all[cor]) all[cor].classList.add('correct');
    try { soundWrong.currentTime = 0; soundWrong.play(); } catch(e){}
    shakeElement(optEl);
  }
  cur++;
  setTimeout(renderQuiz, 700);
}

/* ========== Finish quiz: push to Firebase and show local chart ====== */
function finishQuiz() {
  try { soundFinish.play(); } catch(e){}
  finishedAt = Date.now();
  const durationSec = Math.round((finishedAt - startedAt) / 1000);

  // push to realtime db (if available)
  if (db) {
    try {
      const resultsRef = db.ref('results');
      resultsRef.push({
        name: playerName || "Tanpa Nama",
        score: score,
        time: durationSec,
        ts: Date.now()
      });
    } catch (err) {
      console.error('Firebase push error:', err);
      saveLocalResult(playerName || "Tanpa Nama", score, durationSec);
    }
  } else {
    // fallback local
    saveLocalResult(playerName || "Tanpa Nama", score, durationSec);
  }

  // save local score history for local average chart
  const localScores = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
  localScores.push(score);
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(localScores));

  // show summary locally - leaderboard will be filled by realtime listener if DB available
  qEl.innerHTML = `
    ✅ Kuis selesai!<br>
    <b>Skor kamu:</b> ${score}/${quiz.length}<br>
    <b>Waktu bermain:</b> ${durationSec} detik untuk ${quiz.length} soal
  `;
  optEl.innerHTML = '';
  startBtn.style.display = 'none';
  restartBtn.style.display = 'inline';
  showChartLocal(score);
}

/* local fallback store */
function saveLocalResult(name, score, time) {
  const arr = JSON.parse(localStorage.getItem(LOCAL_RESULTS_KEY) || '[]');
  arr.push({ name, score, time, ts: Date.now() });
  localStorage.setItem(LOCAL_RESULTS_KEY, JSON.stringify(arr));
}

/* chart: try to use Chart.js if present, else show text */
function showChartLocal(myScore) {
  chartEl.style.display = 'block';
  const localScores = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
  const avg = localScores.length ? (localScores.reduce((a,b)=>a+b,0)/localScores.length) : myScore;
  const ctx = chartEl.getContext ? chartEl.getContext("2d") : null;

  if (typeof Chart !== 'undefined' && ctx) {
    // clear previous (Chart.js will handle canvas)
    try { new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Skor Kamu", "Rata-rata Pemain (lokal)"],
        datasets: [{
          data: [myScore, Math.round(avg)],
          backgroundColor: ["#089981", "#1ed5a4"]
        }]
      },
      options: {
        scales: { y: { beginAtZero: true, max: quiz.length } },
        plugins: { legend: { display: false } },
        animation: { duration: 600 }
      }
    }); } catch (e) {
      // fail silently to fallback text
      ctx.clearRect(0,0,chartEl.width, chartEl.height);
      ctx.fillStyle = "#000";
      ctx.fillText(`Skor: ${myScore}  |  Rata-rata lokal: ${Math.round(avg)}`, 10, 20);
    }
  } else if (ctx) {
    ctx.clearRect(0,0,chartEl.width, chartEl.height);
    ctx.fillStyle = "#000";
    ctx.fillText(`Skor: ${myScore}  |  Rata-rata lokal: ${Math.round(avg)}`, 10, 20);
  } else {
    // no canvas support
    resultSummary.innerHTML = `Skor: ${myScore}  |  Rata-rata lokal: ${Math.round(avg)}`;
  }
}

/* start / restart handlers */
startBtn.addEventListener('click', () => {
  if (!playerName) {
    nameWarn.style.display = 'block';
    return;
  }
  nameWarn.style.display = 'none';
  cur = 0; score = 0;
  startedAt = Date.now();
  renderQuiz();
});

restartBtn.addEventListener('click', () => {
  // show entry to allow name change
  playerEntry.style.display = 'block';
  chartEl.style.display = 'none';
  leaderboardWrap.innerHTML = '';
  resultSummary.innerHTML = '';
  startBtn.style.display = 'inline';
  restartBtn.style.display = 'none';
  setStartState(false);
});

/* ========== Navigation (existing behavior kept) ========== */
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll(".section");
  const navLinks = document.getElementById("navLinks");
  const hambtn = document.getElementById("hambtn");

  function showSection(id) {
    sections.forEach(sec => {
      if (sec.id === id) {
        sec.classList.add("active");
        sec.classList.remove("hidden");
      } else {
        sec.classList.remove("active");
        sec.classList.add("hidden");
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.dataset.section;
      showSection(target);
      if (window.innerWidth <= 780) navLinks.classList.remove("show");
    });
  });

  document.getElementById("openQuizBtn").addEventListener("click", () => {
    showSection("quiz");
  });

  if (hambtn && navLinks) {
    hambtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }

  showSection("home");
});

/* ========== Realtime Leaderboard listener (Firebase or fallback to local) ========== */
function escapeHtml(str) {
  return String(str).replace(/[&<>"'`=\/]/g, function(s) {
    return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;' })[s];
  });
}

function renderLeaderboardFromObj(dataObj) {
  const arr = [];
  if (!dataObj) {
    leaderboardWrap.innerHTML = '<div class="small center">Belum ada pemain yang menyelesaikan kuis.</div>';
    resultSummary.innerHTML = '';
    return;
  }
  Object.keys(dataObj).forEach(k => {
    const item = dataObj[k];
    arr.push({
      key: k,
      name: item.name || "Tanpa Nama",
      score: Number(item.score) || 0,
      time: Number(item.time) || 0,
      ts: item.ts || 0
    });
  });

  // sort: score desc, time asc
  arr.sort((a,b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.time - b.time;
  });

  const avgTime = Math.round(arr.reduce((s,it)=>s + (it.time||0), 0) / arr.length);
  const totalPlayers = arr.length;

  resultSummary.innerHTML = `<div style="font-weight:700; margin-top:8px;">Rata-rata pemain bermain selama <b>${avgTime}</b> detik / ${quiz.length} soal. &nbsp; | &nbsp; Jumlah pemain: <b>${totalPlayers}</b> orang</div>`;

  const rows = arr.map((p,i) => `
    <tr>
      <td>${i+1}</td>
      <td style="text-align:left;padding-left:12px">${escapeHtml(p.name)}</td>
      <td>${p.score}</td>
      <td>${p.time}</td>
    </tr>
  `).join('');

  leaderboardWrap.innerHTML = `
    <div class="leaderboard">
      <table>
        <thead>
          <tr>
            <th style="width:60px">Ranking</th>
            <th>Nama</th>
            <th style="width:120px">Skor</th>
            <th style="width:140px">Waktu (detik)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/* Setup DB listener if db available, else show local results */
function attachRealtimeListener() {
  if (!db) {
    // Try to render local stored results
    const local = JSON.parse(localStorage.getItem(LOCAL_RESULTS_KEY) || '[]');
    if (local.length === 0) {
      leaderboardWrap.innerHTML = '<div class="small center">Tidak ada data leaderboard (tidak terhubung ke Firebase).</div>';
      resultSummary.innerHTML = '';
      return;
    }
    // Convert local array to object-like structure for reuse
    const obj = {};
    local.forEach((it, idx) => obj['local_' + idx] = it);
    renderLeaderboardFromObj(obj);
    return;
  }

  try {
    const resultsRef = db.ref('results');
    resultsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      renderLeaderboardFromObj(data);
    }, (err) => {
      console.error('Firebase listener error:', err);
      leaderboardWrap.innerHTML = '<div class="small center">Gagal mengambil data leaderboard realtime.</div>';
    });
  } catch (err) {
    console.error('attachRealtimeListener error:', err);
    leaderboardWrap.innerHTML = '<div class="small center">Tidak dapat terhubung ke leaderboard realtime.</div>';
  }
}

// start listener immediately
attachRealtimeListener();

/* ========== Simulasi CTPS 20s (tidak terkait quiz) ========== */
if (simBtn) {
  simBtn.addEventListener("click", () => {
    let waktu = 20;
    simBtn.disabled = true;
    if (simProgress) simProgress.style.width = "0%";
    if (simTime) simTime.textContent = waktu + "s";
    try { simStartSound.currentTime = 0; simStartSound.play(); } catch(e){}
    const interval = setInterval(() => {
      waktu--;
      if (simTime) simTime.textContent = waktu + "s";
      if (simProgress) simProgress.style.width = ((20 - waktu) / 20) * 100 + "%";
      try { simTickSound.currentTime = 0; simTickSound.play(); } catch(e){}
      if (waktu <= 0) {
        clearInterval(interval);
        try { simEndSound.currentTime = 0; simEndSound.play(); } catch(e){}
        simBtn.disabled = false;
        if (simTime) simTime.textContent = "Selesai ✅";
        setTimeout(() => {
          if (simTime) simTime.textContent = "20s";
          if (simProgress) simProgress.style.width = "0%";
        }, 2000);
      }
    }, 1000);
  });
}

/* === Tambahan: Toggle Mode (Light/Dark) === */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".toggle");
  const dot = document.querySelector(".dot");

  if (toggle) {
    // cek preferensi sebelumnya
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    toggle.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }

      // animasi kecil pada titik toggle
      if (dot) {
        dot.style.transform = "scale(1.4)";
        setTimeout(() => (dot.style.transform = ""), 150);
      }
    });
  }
});

/* ===== START: MASUKAN & SARAN (tambahkan di paling bawah script.js) ===== */
(function() {
  // Ambil elemen (aman walau elemen belum ada di DOM)
  const fbForm = document.getElementById("feedbackForm");
  const fbName = document.getElementById("fbName");
  const fbMsg = document.getElementById("fbMessage");
  const fbList = document.getElementById("feedbackList");
  const fbNotice = document.getElementById("feedbackNotice");

  if (!fbForm) return; // tidak ada form -> hentikan (aman)

  // Render 1 item ke UI
  function renderFeedbackItem(data) {
    const div = document.createElement("div");
    div.className = "feedback-item";
    // escape sederhana untuk mencegah HTML injection
    const safeName = String(data.name || "Anonim").replace(/[&<>"'`=\/]/g, function(s) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;' })[s];
    });
    const safeMsg = String(data.message || "").replace(/[&<>"'`=\/]/g, function(s) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;' })[s];
    });
    div.innerHTML = `<h4>${safeName}</h4><p>${safeMsg}</p>`;
    fbList.prepend(div);
  }

  // Submit handler
  fbForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (fbName.value || "").trim() || "Anonim";
    const message = (fbMsg.value || "").trim();
    if (!message) return;

    // Push ke Firebase jika tersedia
    try {
      if (typeof firebase !== "undefined" && firebase.database) {
        const fbRef = firebase.database().ref("masukan");
        fbRef.push({ name, message, ts: Date.now() });
      } else {
        console.warn("Firebase tidak tersedia — hanya tampilkan secara lokal.");
      }
    } catch (err) {
      console.error("Gagal kirim ke Firebase:", err);
    }

    // Tampilkan langsung di UI
    renderFeedbackItem({ name, message });

    // Kosongkan textarea saja (biarkan nama tetap agar tidak repot pengguna)
    fbMsg.value = "";

    // Notifikasi singkat
    if (fbNotice) {
      fbNotice.style.display = "block";
      fbNotice.style.opacity = "1";
      setTimeout(() => {
        fbNotice.style.opacity = "0";
        setTimeout(() => {
          fbNotice.style.display = "none";
        }, 400);
      }, 2200);
    }
  });

  // Ambil data realtime dari Firebase (jika tersedia)
  try {
    if (typeof firebase !== "undefined" && firebase.database) {
      const fbRef = firebase.database().ref("masukan");
      fbRef.on("value", (snapshot) => {
        const data = snapshot.val();
        fbList.innerHTML = "";
        if (!data) {
          fbList.innerHTML = '<p class="small center">Belum ada masukan.</p>';
          return;
        }
        const arr = Object.values(data).sort((a,b) => (b.ts || 0) - (a.ts || 0));
        arr.forEach(item => renderFeedbackItem(item));
      });
    } else {
      // jika firebase tidak tersedia, biarkan saja (masukan lokal akan tampil saat disubmit)
    }
  } catch (err) {
    console.warn("Tidak bisa ambil data masukan dari Firebase:", err);
  }
})();
 /* ===== END: MASUKAN & SARAN ===== */
