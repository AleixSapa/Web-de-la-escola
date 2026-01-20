import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Chess } from "https://esm.sh/chess.js@1.0.0-beta.8";
import { GoogleGenAI } from "https://esm.sh/@google/genai@^1.10.0";

// --- CONFIGURACIÓ ---
const SUPABASE_URL = "https://hocwnqqdyyinjrtczhdw.supabase.co";
const SUPABASE_KEY = "sb_publishable_X_TrrWex0GfBLIzbKFp1Cg_Xa97mziS"; // Clau pública del codi original
// ⚠️ IMPORTANT: Substitueix això amb la teva clau real per a que funcioni la IA
const GEMINI_API_KEY = "POSA_AQUI_LA_TEVA_CLAU_API_DE_GOOGLE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let genAI = null;
if (
  GEMINI_API_KEY &&
  GEMINI_API_KEY !== "POSA_AQUI_LA_TEVA_CLAU_API_DE_GOOGLE"
) {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// --- ICONES SVG ---
const ICONS = {
  user: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.108a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.642Z" /></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H4.5a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>',
  role: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-8 w-8 text-blue-600"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /></svg>',
  pawn: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-10 w-10 text-gray-700 group-hover:text-indigo-600"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21.75c2.485 0 4.5-2.015 4.5-4.5V15h-9v2.25c0 2.485 2.015 4.5 4.5 4.5z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 15V9" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 9h3" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 9a3 3 0 100-6 3 3 0 000 6z" /></svg>',
};

// --- ESTAT GLOBAL ---
const state = {
  currentUser: null,
  allUsers: [],
  conversations: [],
  currentView: "loading",
  selectedConversationId: null,
  chessGame: null,
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
};

// --- DOM ELEMENTS ---
const views = {
  loading: document.getElementById("loading-view"),
  login: document.getElementById("login-view"),
  dashboard: document.getElementById("dashboard-view"),
  chat: document.getElementById("chat-view"),
  chess: document.getElementById("chess-view"),
};

// --- INICIALITZACIÓ ---
async function init() {
  // Inject icons
  document.getElementById("user-icon-container").innerHTML = ICONS.user;
  document.getElementById("lock-icon-container").innerHTML = ICONS.lock;
  document.getElementById("login-icon-container").innerHTML = ICONS.role;

  // Load Data
  try {
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("*");
    if (users) state.allUsers = users;

    const { data: convs, error: convError } = await supabase
      .from("conversations")
      .select("*");
    if (convs) state.conversations = convs;
  } catch (e) {
    console.error("Error loading data", e);
  }

  switchView("login");
}

function switchView(viewName) {
  Object.values(views).forEach((el) => el.classList.add("hidden"));
  views[viewName].classList.remove("hidden");
  state.currentView = viewName;
}

// --- LOGIN ---
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msgEl = document.getElementById("login-message");
  const btn = document.getElementById("login-btn");

  btn.disabled = true;
  btn.textContent = "Iniciant...";
  msgEl.classList.add("hidden");

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .maybeSingle();

    if (user) {
      state.currentUser = user;
      renderDashboard();
      switchView("dashboard");
    } else {
      msgEl.textContent = "Usuari o contrasenya incorrectes.";
      msgEl.className =
        "block p-4 rounded-md text-sm text-center bg-red-100 text-red-800";
    }
  } catch (err) {
    console.error(err);
    msgEl.textContent = "Error de connexió.";
    msgEl.className =
      "block p-4 rounded-md text-sm text-center bg-red-100 text-red-800";
  } finally {
    btn.disabled = false;
    btn.textContent = "Inicia Sessió";
  }
});

// --- DASHBOARD ---
function renderDashboard() {
  document.getElementById("user-role-display").textContent =
    state.currentUser.role;
  document.getElementById("user-name-display").textContent =
    state.currentUser.username;

  const content = document.getElementById("dashboard-content");
  content.innerHTML = "";

  if (state.currentUser.role === "Alumne") {
    content.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Benvingut, ${state.currentUser.name}!</h2>
            <div class="grid md:grid-cols-2 gap-6">
                <button id="play-chess-btn" class="bg-white p-6 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center group text-left w-full">
                    <div class="bg-gray-100 rounded-full p-4 group-hover:bg-indigo-100 transition-colors">
                        ${ICONS.pawn}
                    </div>
                    <h4 class="text-xl font-bold text-gray-800 mt-4">Jugar a Escacs (IA)</h4>
                </button>
            </div>
        `;
    document
      .getElementById("play-chess-btn")
      .addEventListener("click", startChessGame);
  } else {
    content.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-lg"><p>Benvingut al panell de ${state.currentUser.role}.</p></div>`;
  }
}

document.getElementById("logout-btn").addEventListener("click", () => {
  state.currentUser = null;
  switchView("login");
});

// --- NAVIGATION ---
document.getElementById("nav-chat-btn").addEventListener("click", () => {
  renderChatList();
  switchView("chat");
});

document
  .getElementById("chat-back-btn")
  .addEventListener("click", () => switchView("dashboard"));
document
  .getElementById("chess-back-btn")
  .addEventListener("click", () => switchView("dashboard"));

// --- CHAT ---
function renderChatList() {
  const list = document.getElementById("conversations-list");
  list.innerHTML = "";

  const myConvs = state.conversations.filter((c) =>
    c.participants.includes(state.currentUser.username)
  );

  if (myConvs.length === 0) {
    list.innerHTML =
      '<div class="p-4 text-center text-gray-500">No tens converses.</div>';
    return;
  }

  myConvs.forEach((conv) => {
    const div = document.createElement("div");
    div.className = `p-4 cursor-pointer border-l-4 transition-colors hover:bg-gray-100 ${
      state.selectedConversationId === conv.id
        ? "bg-blue-50 border-blue-500"
        : "border-transparent"
    }`;

    let name = conv.name;
    if (!conv.isGroup) {
      const other = conv.participants.find(
        (p) => p !== state.currentUser.username
      );
      const u = state.allUsers.find((user) => user.username === other);
      name = u ? u.name : other;
    }

    div.innerHTML = `<p class="font-semibold text-gray-800">${
      name || "Xat"
    }</p>`;
    div.onclick = () => openConversation(conv.id);
    list.appendChild(div);
  });
}

function openConversation(id) {
  state.selectedConversationId = id;
  renderChatList(); // Update highlight

  const conv = state.conversations.find((c) => c.id === id);
  const container = document.getElementById("messages-container");
  const header = document.getElementById("chat-header");
  const inputArea = document.getElementById("chat-input-area");
  const title = document.getElementById("chat-title");

  header.classList.remove("hidden");
  inputArea.classList.remove("hidden");

  let name = conv.name;
  if (!conv.isGroup) {
    const other = conv.participants.find(
      (p) => p !== state.currentUser.username
    );
    const u = state.allUsers.find((user) => user.username === other);
    name = u ? u.name : other;
  }
  title.textContent = name;

  renderMessages(conv.messages);
}

function renderMessages(messages) {
  const container = document.getElementById("messages-container");
  container.innerHTML = "";

  messages.forEach((msg) => {
    const isMe = msg.sender === state.currentUser.username;
    const div = document.createElement("div");
    div.className = `flex mb-4 ${isMe ? "justify-end" : "justify-start"}`;

    let content = `<p>${msg.text}</p>`;
    if (msg.audioBase64) {
      content = `<audio controls src="${msg.audioBase64}" class="max-w-[200px]"></audio>`;
    } else if (msg.imageBase64) {
      content = `<img src="${msg.imageBase64}" class="max-w-[200px] rounded" />`;
    }

    div.innerHTML = `
            <div class="max-w-xs p-3 rounded-lg shadow-sm ${
              isMe ? "bg-blue-500 text-white" : "bg-white text-gray-800"
            }">
                ${
                  !isMe && msg.sender !== "system"
                    ? `<p class="text-xs font-bold mb-1 opacity-70">${msg.sender}</p>`
                    : ""
                }
                ${content}
                <p class="text-xs mt-1 opacity-70 text-right">${new Date(
                  msg.timestamp
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
            </div>
        `;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

document
  .getElementById("message-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text || !state.selectedConversationId) return;

    await sendMessage({ text });
    input.value = "";
  });

async function sendMessage(msgData) {
  const convIndex = state.conversations.findIndex(
    (c) => c.id === state.selectedConversationId
  );
  if (convIndex === -1) return;

  const newMessage = {
    id: `msg-${Date.now()}`,
    sender: state.currentUser.username,
    timestamp: new Date().toISOString(),
    ...msgData,
  };

  // Optimistic UI update
  state.conversations[convIndex].messages.push(newMessage);
  renderMessages(state.conversations[convIndex].messages);

  // Save to Supabase
  await supabase.from("conversations").upsert(state.conversations[convIndex]);
}

// --- NEW CHAT MODAL ---
const modal = document.getElementById("modal-overlay");
const newChatModal = document.getElementById("new-chat-modal");

document.getElementById("new-chat-btn").addEventListener("click", () => {
  modal.classList.remove("hidden");
  newChatModal.classList.remove("hidden");
  renderUserList();
});

document.querySelectorAll(".close-modal").forEach((btn) => {
  btn.onclick = () => modal.classList.add("hidden");
});

function renderUserList() {
  const list = document.getElementById("user-list");
  list.innerHTML = "";
  const search = document.getElementById("user-search").value.toLowerCase();

  state.allUsers
    .filter(
      (u) =>
        u.username !== state.currentUser.username &&
        u.name.toLowerCase().includes(search)
    )
    .forEach((u) => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between p-2 hover:bg-gray-100";
      li.innerHTML = `<span>${u.name}</span> <input type="checkbox" value="${u.username}" class="user-select-cb">`;
      list.appendChild(li);
    });
}

document
  .getElementById("user-search")
  .addEventListener("input", renderUserList);
document.getElementById("user-list").addEventListener("change", (e) => {
  const cbs = document.querySelectorAll(".user-select-cb:checked");
  const groupInput = document.getElementById("group-name-input");
  if (cbs.length > 1) groupInput.classList.remove("hidden");
  else groupInput.classList.add("hidden");
});

document
  .getElementById("create-chat-confirm")
  .addEventListener("click", async () => {
    const selected = Array.from(
      document.querySelectorAll(".user-select-cb:checked")
    ).map((cb) => cb.value);
    if (selected.length === 0) return;

    const participants = [state.currentUser.username, ...selected];
    const isGroup = participants.length > 2;
    const name = isGroup
      ? document.getElementById("group-name-input").value
      : null;

    if (isGroup && !name) {
      alert("Posa nom al grup");
      return;
    }

    const newConv = {
      id: `conv-${Date.now()}`,
      participants,
      messages: [],
      isGroup,
      name,
      creator: state.currentUser.username,
    };

    state.conversations.push(newConv);
    await supabase.from("conversations").insert(newConv);

    modal.classList.add("hidden");
    renderChatList();
    openConversation(newConv.id);
  });

// --- CAMERA & MIC (Simple implementation) ---
document.getElementById("camera-btn").addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();
    // A real implementation would show a modal. Here we just capture instantly for simplicity demo
    await new Promise((r) => setTimeout(r, 1000)); // wait for camera to ready

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    stream.getTracks().forEach((t) => t.stop());

    sendMessage({ imageBase64: canvas.toDataURL("image/jpeg") });
  } catch (e) {
    alert("Error càmera: " + e.message);
  }
});

// --- ESCACS ---
function startChessGame() {
  state.chessGame = new Chess();
  renderChessboard();
  switchView("chess");
  document.getElementById("chess-status").textContent = "Torn de: Blanques";
}

document
  .getElementById("new-game-btn")
  .addEventListener("click", startChessGame);

function renderChessboard(highlightMoves = []) {
  const boardEl = document.getElementById("chessboard");
  boardEl.innerHTML = "";
  const board = state.chessGame.board();

  // Map pieces to unicode
  const PIECES = {
    w: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
    b: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" },
  };

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareName = String.fromCharCode(97 + colIndex) + (8 - rowIndex);
      const div = document.createElement("div");
      const isDark = (rowIndex + colIndex) % 2 === 1;

      div.className = `chess-square ${isDark ? "dark" : "light"}`;
      div.dataset.square = squareName;

      if (square) {
        div.innerHTML = `<span>${PIECES[square.color][square.type]}</span>`;
        if (state.chessGame.turn() === "w" && square.color === "w") {
          div.classList.add("clickable");
        }
      }

      if (highlightMoves.includes(squareName)) {
        div.classList.add("possible-move", "clickable");
      }

      div.onclick = () => handleSquareClick(squareName);
      boardEl.appendChild(div);
    });
  });
}

let selectedSquare = null;

async function handleSquareClick(square) {
  // Si és torn de la IA, ignorar
  if (state.chessGame.turn() === "b") return;

  // Si cliquem una peça nostra
  const piece = state.chessGame.get(square);
  if (piece && piece.color === "w") {
    selectedSquare = square;
    const moves = state.chessGame
      .moves({ square, verbose: true })
      .map((m) => m.to);
    renderChessboard(moves);
    // Highlight selection visual logic simple
    const cell = document.querySelector(`[data-square="${square}"]`);
    if (cell) cell.classList.add("selected");
    return;
  }

  // Si intentem moure
  if (selectedSquare) {
    try {
      const move = state.chessGame.move({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });

      if (move) {
        selectedSquare = null;
        renderChessboard();
        checkGameOver();
        if (!state.chessGame.isGameOver()) {
          await makeAiMove();
        }
      }
    } catch (e) {
      // Moviment invalid
      selectedSquare = null;
      renderChessboard();
    }
  }
}

async function makeAiMove() {
  if (!genAI) {
    // Fallback random move if no API Key
    setTimeout(() => {
      const moves = state.chessGame.moves();
      const move = moves[Math.floor(Math.random() * moves.length)];
      state.chessGame.move(move);
      renderChessboard();
      checkGameOver();
    }, 500);
    return;
  }

  document.getElementById("ai-thinking").classList.remove("hidden");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fen = state.chessGame.fen();
    const prompt = `Ets un motor d'escacs. FEN: ${fen}. És el torn de les negres. Respon NOMÉS amb el millor moviment en notació algebraica (ex: "e5", "Nf6").`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    console.log("IA diu:", text);
    state.chessGame.move(text);
  } catch (e) {
    console.error("Error IA", e);
    // Fallback random
    const moves = state.chessGame.moves();
    if (moves.length > 0)
      state.chessGame.move(moves[Math.floor(Math.random() * moves.length)]);
  } finally {
    document.getElementById("ai-thinking").classList.add("hidden");
    renderChessboard();
    checkGameOver();
  }
}

function checkGameOver() {
  const statusEl = document.getElementById("chess-status");
  if (state.chessGame.isCheckmate()) {
    statusEl.textContent = `Escac i Mat! Guanya: ${
      state.chessGame.turn() === "w" ? "Negres" : "Blanques"
    }`;
  } else if (state.chessGame.isDraw()) {
    statusEl.textContent = "Empat!";
  } else {
    statusEl.textContent = `Torn de: ${
      state.chessGame.turn() === "w" ? "Blanques" : "Negres"
    }`;
  }
}

// Iniciar app
init();
