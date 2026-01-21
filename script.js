import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { Chess } from "chess.js";

// --- CONFIGURACIÓ ---
const SUPABASE_URL = "https://hocwnqqdyyinjrtczhdw.supabase.co";
const SUPABASE_KEY = "sb_publishable_X_TrrWex0GfBLIzbKFp1Cg_Xa97mziS"; // Clau pública del teu codi original
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // <--- AFEGEIX LA TEVA CLAU AQUÍ

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let aiClient = null;
if (GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY") {
  aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// --- ESTAT GLOBAL ---
const state = {
  user: null, // { username, role, name, subject... }
  users: [],
  conversations: [],
  currentPage: "login", // login, dashboard, chat, chess
  chessGame: null,
};

// --- ICONES (SVG Strings) ---
const Icons = {
  User: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.108a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.642Z" /></svg>`,
  Lock: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H4.5a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>`,
  Chat: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.537a59.014 59.014 0 0 1-5.032 0l-3.722-.537C3.347 17.1 2.5 16.136 2.5 15v-4.286c0-.97.616-1.813 1.5-2.097L6.6 6.49M20.25 8.511l-6.442-3.22a44.947 44.947 0 0 0-5.616 0L1.75 6.49m9.191 1.063c.22.046.45.082.68.118l3.45-1.725a2.25 2.25 0 0 1 2.158 1.162l.516 1.032a2.25 2.25 0 0 1-1.162 2.158l-3.45 1.725a1.125 1.125 0 0 1-1.229-.586l-.516-1.032a1.125 1.125 0 0 1 .586-1.229Zm-2.836.216a1.125 1.125 0 0 1-.586 1.229l-3.45 1.725a2.25 2.25 0 0 1-2.158-1.162l-.516-1.032a2.25 2.25 0 0 1 1.162-2.158l3.45-1.725c.22.046.45.082.68.118a1.125 1.125 0 0 1 .586 1.229Z" /></svg>`,
  Logout: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H5.25" /></svg>`,
  Chess: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-purple-600"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5M19.5 8.25h1.5m-18 0h1.5M19.5 12h1.5m-18 0h1.5m15 3.75h1.5m-18 0h1.5M15.75 21v-1.5m-5.625-9.375a1.875 1.875 0 013.75 0V12a1.875 1.875 0 01-3.75 0V8.25z" /></svg>`,
  ArrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>`,
};

// --- DOM ELEMENTS ---
const app = document.getElementById("app");

// --- INITIALIZATION ---
async function init() {
  try {
    const { data: users } = await supabase.from("users").select("*");
    if (users) state.users = users;
    renderLogin();
  } catch (err) {
    console.error("Error inicial:", err);
    app.innerHTML = `<div class="text-red-600">Error carregant l'aplicació. Comprova la consola.</div>`;
  }
}

// --- RENDERING VIEWS ---

function renderLogin() {
  state.currentPage = "login";
  app.innerHTML = `
    <div class="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Portal Escolar</h1>
            <p class="text-gray-500 mt-2">Inicia sessió per accedir</p>
        </div>
        <form id="loginForm" class="space-y-6">
            <div class="relative">
                <input id="username" type="text" placeholder="Nom d'usuari" required class="w-full rounded-md border py-2.5 px-3 ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-600">
            </div>
            <div class="relative">
                <input id="password" type="password" placeholder="Contrasenya" required class="w-full rounded-md border py-2.5 px-3 ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-600">
            </div>
            <div id="loginMessage" class="text-center text-sm hidden"></div>
            <button type="submit" class="w-full bg-blue-600 text-white rounded-md py-2.5 font-semibold hover:bg-blue-500 transition-all">Inicia Sessió</button>
        </form>
    </div>`;

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  const userIn = document.getElementById("username").value;
  const passIn = document.getElementById("password").value;
  const msgDiv = document.getElementById("loginMessage");
  const btn = e.target.querySelector("button");

  btn.disabled = true;
  btn.textContent = "Verificant...";
  msgDiv.classList.remove("hidden");
  msgDiv.textContent = "";

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", userIn)
    .eq("password", passIn) // En producció s'ha de fer hash
    .maybeSingle();

  if (error || !user) {
    msgDiv.textContent = "Credencials incorrectes o error de xarxa.";
    msgDiv.className = "text-center text-sm text-red-600";
    btn.disabled = false;
    btn.textContent = "Inicia Sessió";
  } else {
    state.user = user;
    msgDiv.textContent = `Hola ${user.name}! Redirigint...`;
    msgDiv.className = "text-center text-sm text-green-600";
    setTimeout(() => renderDashboard(), 1000);
  }
}

function renderDashboard() {
  state.currentPage = "dashboard";
  const { user } = state;

  app.innerHTML = `
    <div class="w-full max-w-4xl mx-auto p-6 animate-fade-in">
        <header class="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-white p-6 rounded-2xl shadow-md">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Hola, ${
                  user.name
                }</h1>
                <p class="text-gray-600">Rol: <span class="font-semibold text-blue-700">${
                  user.role
                }</span></p>
            </div>
            <div class="flex gap-2">
                <button id="btnChat" class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                    ${Icons.Chat} Xat
                </button>
                <button id="btnChess" class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition">
                    Escacs vs IA
                </button>
                <button id="btnLogout" class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">
                    ${Icons.Logout} Sortir
                </button>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${getDashboardCards(user.role)}
        </div>
    </div>`;

  document.getElementById("btnLogout").addEventListener("click", () => {
    state.user = null;
    renderLogin();
  });
  document.getElementById("btnChat").addEventListener("click", renderChat);
  document.getElementById("btnChess").addEventListener("click", renderChess);
}

function getDashboardCards(role) {
  if (role === "Professor") {
    return `
            <div class="bg-white p-6 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
                <h3 class="text-xl font-bold text-gray-800">Gestió d'Exàmens</h3>
                <p class="text-gray-500 text-sm">Crear i corregir exàmens.</p>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
                <h3 class="text-xl font-bold text-gray-800">Gestió de Deures</h3>
                <p class="text-gray-500 text-sm">Assignar tasques als alumnes.</p>
            </div>`;
  } else if (role === "Alumne") {
    return `
            <div class="bg-white p-6 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
                <h3 class="text-xl font-bold text-gray-800">Les Meves Notes</h3>
                <p class="text-gray-500 text-sm">Consultar resultats acadèmics.</p>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
                <h3 class="text-xl font-bold text-gray-800">Deures Pendents</h3>
                <p class="text-gray-500 text-sm">Veure tasques per fer.</p>
            </div>`;
  } else {
    // Admin
    return `<div class="bg-white p-6 rounded-2xl shadow-lg"><h3 class="font-bold">Panell d'Admin</h3></div>`;
  }
}

// --- XAT LOGIC ---

async function renderChat() {
  state.currentPage = "chat";
  app.innerHTML = `
    <div class="w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-lg flex flex-col animate-fade-in overflow-hidden">
        <header class="p-4 border-b flex items-center justify-between bg-gray-50">
            <button id="backDash" class="flex items-center gap-1 text-gray-600 hover:text-black">${Icons.ArrowLeft} Tornar</button>
            <h2 class="font-bold text-lg">Xat Escolar</h2>
            <div class="w-16"></div>
        </header>
        <div class="flex flex-grow overflow-hidden">
            <aside id="chatList" class="w-1/3 border-r bg-gray-50 overflow-y-auto p-2">
                <p class="text-center text-gray-500 text-sm mt-4">Carregant converses...</p>
            </aside>
            <main class="w-2/3 flex flex-col">
                <div id="messagesArea" class="flex-grow p-4 overflow-y-auto bg-white">
                    <div class="flex h-full items-center justify-center text-gray-400">Selecciona un xat</div>
                </div>
                <form id="msgForm" class="p-4 border-t flex gap-2 bg-gray-50 hidden">
                    <input id="msgInput" type="text" placeholder="Escriu..." class="flex-grow border rounded-md px-3 py-2">
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md">Enviar</button>
                </form>
            </main>
        </div>
    </div>`;

  document
    .getElementById("backDash")
    .addEventListener("click", renderDashboard);

  // Fetch conversations
  const { data: convs } = await supabase.from("conversations").select("*");
  state.conversations = convs || [];
  const myConvs = state.conversations.filter((c) =>
    c.participants.includes(state.user.username)
  );

  const listEl = document.getElementById("chatList");
  listEl.innerHTML = "";

  if (myConvs.length === 0)
    listEl.innerHTML = '<p class="p-4 text-center">No tens xats actius.</p>';

  myConvs.forEach((c) => {
    const div = document.createElement("div");
    const name = c.isGroup
      ? c.name
      : c.participants.find((p) => p !== state.user.username) || "Chat";
    div.className =
      "p-3 mb-2 bg-white rounded shadow-sm cursor-pointer hover:bg-blue-50 transition";
    div.innerHTML = `<p class="font-bold text-sm">${name}</p>`;
    div.onclick = () => loadConversation(c.id);
    listEl.appendChild(div);
  });
}

function loadConversation(convId) {
  const conv = state.conversations.find((c) => c.id === convId);
  const msgArea = document.getElementById("messagesArea");
  const form = document.getElementById("msgForm");

  form.classList.remove("hidden");
  msgArea.innerHTML = "";

  // Render messages
  conv.messages.forEach((msg) => {
    const isMe = msg.sender === state.user.username;
    const bubble = document.createElement("div");
    bubble.className = `flex mb-2 ${isMe ? "justify-end" : "justify-start"}`;
    bubble.innerHTML = `
            <div class="${
              isMe ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            } px-4 py-2 rounded-lg max-w-xs text-sm break-words">
                ${
                  !isMe && conv.isGroup
                    ? `<p class="text-xs font-bold mb-1 opacity-75">${msg.sender}</p>`
                    : ""
                }
                ${msg.text}
            </div>
        `;
    msgArea.appendChild(bubble);
  });
  msgArea.scrollTop = msgArea.scrollHeight;

  // Handle Send
  form.onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById("msgInput");
    const text = input.value.trim();
    if (!text) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      text: text,
      sender: state.user.username,
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    conv.messages.push(newMsg);
    loadConversation(convId);
    input.value = "";

    // Save to DB
    await supabase
      .from("conversations")
      .update({ messages: conv.messages })
      .eq("id", convId);
  };
}

// --- CHESS LOGIC ---

function renderChess() {
  state.currentPage = "chess";
  state.chessGame = new Chess();

  app.innerHTML = `
    <div class="w-full max-w-4xl bg-white p-6 rounded-2xl shadow-lg animate-fade-in flex flex-col items-center">
        <div class="w-full flex justify-between items-center mb-6">
            <button id="backDashChess" class="flex items-center gap-1 text-gray-600 hover:text-black">${Icons.ArrowLeft} Tornar</button>
            <h2 class="font-bold text-xl flex items-center gap-2">${Icons.Chess} Escacs vs IA (Gemini)</h2>
            <button id="resetGame" class="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-semibold">Nova Partida</button>
        </div>
        
        <div class="flex flex-col md:flex-row gap-8">
            <div id="chessboard" class="grid grid-cols-8 w-[320px] h-[320px] md:w-[400px] md:h-[400px] border-4 border-gray-800"></div>
            
            <div class="w-full md:w-64 space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg border">
                    <p class="text-sm text-gray-500">Estat:</p>
                    <p id="gameStatus" class="font-bold text-lg text-gray-800">Torn de les Blanques</p>
                </div>
                <div id="aiThinking" class="hidden text-blue-600 font-semibold animate-pulse">
                    La IA està pensant...
                </div>
                <div class="text-xs text-gray-400 mt-4">
                    Peces blanques: ${state.user.username}<br>
                    Peces negres: Gemini AI
                </div>
            </div>
        </div>
    </div>`;

  document
    .getElementById("backDashChess")
    .addEventListener("click", renderDashboard);
  document.getElementById("resetGame").addEventListener("click", renderChess);

  drawBoard();
}

let selectedSquare = null;

function drawBoard() {
  const boardEl = document.getElementById("chessboard");
  boardEl.innerHTML = "";
  const board = state.chessGame.board();
  const isWhiteTurn = state.chessGame.turn() === "w";

  // Map pieces to unicode
  const pieces = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const div = document.createElement("div");
      const isDark = (rowIndex + colIndex) % 2 === 1;
      const squareId = String.fromCharCode(97 + colIndex) + (8 - rowIndex);

      div.className = `chess-square w-full h-full text-4xl cursor-pointer ${
        isDark ? "bg-emerald-700 text-white" : "bg-emerald-100 text-black"
      }`;

      if (selectedSquare === squareId) div.classList.add("bg-yellow-400"); // Highlight selection

      if (square) {
        const p =
          square.color === "w" ? square.type.toUpperCase() : square.type;
        div.textContent = pieces[p];
        if (square.color === "w") div.style.color = isDark ? "#fff" : "#000";
        else div.style.color = "#000"; // Black pieces always black
      }

      div.onclick = () => handleSquareClick(squareId);
      boardEl.appendChild(div);
    });
  });

  updateStatus();
}

async function handleSquareClick(squareId) {
  if (state.chessGame.turn() !== "w" || state.chessGame.isGameOver()) return;

  if (!selectedSquare) {
    // Select
    const piece = state.chessGame.get(squareId);
    if (piece && piece.color === "w") {
      selectedSquare = squareId;
      drawBoard();
    }
  } else {
    // Move
    try {
      const move = state.chessGame.move({
        from: selectedSquare,
        to: squareId,
        promotion: "q",
      });

      selectedSquare = null;
      drawBoard();

      if (move) {
        // AI Turn
        await makeAiMove();
      }
    } catch (e) {
      // Invalid move or clicked own piece to switch selection
      const piece = state.chessGame.get(squareId);
      if (piece && piece.color === "w") {
        selectedSquare = squareId;
      } else {
        selectedSquare = null;
      }
      drawBoard();
    }
  }
}

async function makeAiMove() {
  if (state.chessGame.isGameOver()) return;

  const thinkingEl = document.getElementById("aiThinking");
  thinkingEl.classList.remove("hidden");

  const fen = state.chessGame.fen();
  let bestMove = null;

  try {
    if (!aiClient) throw new Error("API Key not configured");

    const prompt = `Ets un motor d'escacs. FEN: ${fen}. És el torn de les negres. Respon NOMÉS amb el moviment en notació SAN (ex: "e5", "Nf6").`;

    const response = await aiClient.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    const text = await response.response.text();
    bestMove = text.trim();
    state.chessGame.move(bestMove);
  } catch (err) {
    console.warn("AI Fallback (Random Move) due to error:", err);
    const moves = state.chessGame.moves();
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      state.chessGame.move(randomMove);
    }
  } finally {
    thinkingEl.classList.add("hidden");
    drawBoard();
  }
}

function updateStatus() {
  const statusEl = document.getElementById("gameStatus");
  if (state.chessGame.isCheckmate()) {
    statusEl.textContent = `Partida finalitzada. Guanyen: ${
      state.chessGame.turn() === "w" ? "Negres" : "Blanques"
    }`;
    statusEl.className = "font-bold text-red-600";
  } else if (state.chessGame.inCheck()) {
    statusEl.textContent = "ESCAC!";
    statusEl.className = "font-bold text-orange-600";
  } else {
    statusEl.textContent = `Torn de: ${
      state.chessGame.turn() === "w" ? "Blanques" : "Negres"
    }`;
    statusEl.className = "font-bold text-gray-800";
  }
}

// Start
init();
