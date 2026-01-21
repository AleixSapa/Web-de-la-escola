import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Chess } from "https://esm.sh/chess.js@1.0.0-beta.8";
import { GoogleGenAI } from "https://esm.sh/@google/genai@^1.10.0";

// --- CONFIGURACIÓ ---
const SUPABASE_URL = "https://hocwnqqdyyinjrtczhdw.supabase.co";
const SUPABASE_KEY = "sb_publishable_X_TrrWex0GfBLIzbKFp1Cg_Xa97mziS"; // Clau pública del teu codi original
const GEMINI_API_KEY = "POSA_AQUI_LA_TEVA_CLAU_API_DE_GEMINI"; // ⚠️ NECESSITES POSAR LA TEVA CLAU API

// Inicialització de clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let aiClient = null;
if (
  GEMINI_API_KEY &&
  GEMINI_API_KEY !== "POSA_AQUI_LA_TEVA_CLAU_API_DE_GEMINI"
) {
  aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// --- ESTAT GLOBAL ---
const state = {
  user: null, // { id, username, role, name, ... }
  conversations: [],
  selectedConversationId: null,
  chessGame: null,
  chessBoard: null, // Array 8x8
  isAiThinking: false,
};

// --- ICONES SVG (Strings) ---
const ICONS = {
  chess: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-indigo-600"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /></svg>`,
  chat: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-green-600"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.537a59.014 59.014 0 0 1-5.032 0l-3.722-.537C3.347 17.1 2.5 16.136 2.5 15v-4.286c0-.97.616-1.813 1.5-2.097L6.6 6.49M20.25 8.511l-6.442-3.22a44.947 44.947 0 0 0-5.616 0L1.75 6.49m9.191 1.063c.22.046.45.082.68.118l3.45-1.725a2.25 2.25 0 0 1 2.158 1.162l.516 1.032a2.25 2.25 0 0 1-1.162 2.158l-3.45 1.725a1.125 1.125 0 0 1-1.229-.586l-.516-1.032a1.125 1.125 0 0 1 .586-1.229Zm-2.836.216a1.125 1.125 0 0 1-.586 1.229l-3.45 1.725a2.25 2.25 0 0 1-2.158-1.162l-.516-1.032a2.25 2.25 0 0 1 1.162-2.158l3.45-1.725c.22.046.45.082.68.118a1.125 1.125 0 0 1 .586 1.229Z" /></svg>`,
  exam: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-blue-600"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /></svg>`,
};

// --- APP LOGIC ---
const app = {
  init: async () => {
    document.getElementById("loader").classList.add("hidden");
    app.navigateTo("login");

    // Listeners
    document
      .getElementById("login-form")
      .addEventListener("submit", app.handleLogin);
    document
      .getElementById("chat-form")
      .addEventListener("submit", app.handleSendMessage);
  },

  navigateTo: (viewName) => {
    document
      .querySelectorAll(".view-section")
      .forEach((el) => el.classList.add("hidden"));
    document.getElementById(`view-${viewName}`).classList.remove("hidden");

    if (viewName === "dashboard") app.renderDashboard();
    if (viewName === "chat") app.loadChat();
    if (viewName === "chess") app.initChess();
  },

  // --- LOGIN ---
  handleLogin: async (e) => {
    e.preventDefault();
    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;
    const msgEl = document.getElementById("login-message");

    msgEl.innerText = "Verificant...";
    msgEl.classList.remove(
      "hidden",
      "bg-red-100",
      "text-red-800",
      "bg-green-100",
      "text-green-800"
    );

    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", userIn)
        .eq("password", passIn)
        .maybeSingle();

      if (error || !user) {
        throw new Error("Credencials incorrectes");
      }

      state.user = user;
      msgEl.innerText = "Login correcte!";
      msgEl.classList.add("bg-green-100", "text-green-800");
      setTimeout(() => app.navigateTo("dashboard"), 1000);
    } catch (err) {
      msgEl.innerText = err.message;
      msgEl.classList.add("bg-red-100", "text-red-800");
    }
  },

  logout: () => {
    state.user = null;
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("login-message").classList.add("hidden");
    app.navigateTo("login");
  },

  // --- DASHBOARD ---
  renderDashboard: () => {
    if (!state.user) return app.navigateTo("login");

    document.getElementById("user-display-name").innerText = state.user.name;
    document.getElementById("user-role-display").innerText = state.user.role;

    const container = document.getElementById("dashboard-content");
    container.innerHTML = "";

    // Botó Escacs (Comú a tots)
    container.innerHTML += `
            <button onclick="app.navigateTo('chess')" class="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 border border-gray-100 group text-left">
                <div class="bg-indigo-100 p-4 rounded-full group-hover:bg-indigo-200 transition-colors">
                   ${ICONS.chess}
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-800">Escacs IA</h3>
                    <p class="text-gray-500 text-sm">Juga contra la intel·ligència artificial.</p>
                </div>
            </button>
        `;

    // Botons específics per rol (Simplificat per demo)
    if (state.user.role === "Professor") {
      container.innerHTML += `
                <div class="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Panell de Professor</h3>
                    <p class="text-gray-500">Aquí anirien les eines de gestió d'exàmens i deures.</p>
                </div>
            `;
    } else if (state.user.role === "Alumne") {
      container.innerHTML += `
                <div class="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Les Meves Notes</h3>
                    <p class="text-gray-500">Consulta els teus resultats acadèmics.</p>
                </div>
            `;
    }
  },

  // --- CHAT ---
  loadChat: async () => {
    if (!state.user) return;

    // 1. Carregar converses
    const { data: convs, error } = await supabase
      .from("conversations")
      .select("*");

    if (convs) {
      // Filtrar converses on participa l'usuari
      state.conversations = convs.filter((c) =>
        c.participants.includes(state.user.username)
      );
      app.renderConversationList();
    }
  },

  renderConversationList: () => {
    const list = document.getElementById("chat-list");
    list.innerHTML = "";

    if (state.conversations.length === 0) {
      list.innerHTML =
        '<p class="p-4 text-gray-500 text-center">No tens converses.</p>';
      return;
    }

    state.conversations.forEach((conv) => {
      // Determinar nom a mostrar
      let name = conv.name;
      if (!conv.isGroup) {
        const other = conv.participants.find((p) => p !== state.user.username);
        name = other || "Desconegut";
      }

      const div = document.createElement("div");
      div.className = `p-4 cursor-pointer border-b hover:bg-gray-100 flex items-center gap-3 ${
        state.selectedConversationId === conv.id
          ? "bg-blue-50 border-l-4 border-l-blue-500"
          : ""
      }`;
      div.innerHTML = `
                <div class="bg-gray-200 p-2 rounded-full text-gray-600 font-bold w-10 h-10 flex items-center justify-center">
                    ${name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p class="font-semibold text-gray-800">${name}</p>
                    <p class="text-xs text-gray-500">Fes clic per veure</p>
                </div>
            `;
      div.onclick = () => app.selectConversation(conv.id);
      list.appendChild(div);
    });
  },

  selectConversation: (id) => {
    state.selectedConversationId = id;
    app.renderConversationList(); // Update active styles
    app.renderMessages();
  },

  renderMessages: () => {
    const container = document.getElementById("chat-messages");
    container.innerHTML = "";

    const conv = state.conversations.find(
      (c) => c.id === state.selectedConversationId
    );
    if (!conv) return;

    // Header del xat (opcional, posar nom)

    conv.messages.forEach((msg) => {
      const isMe = msg.sender === state.user.username;
      const msgDiv = document.createElement("div");
      msgDiv.className = `flex ${isMe ? "justify-end" : "justify-start"}`;

      const bubble = document.createElement("div");
      bubble.className = `max-w-xs md:max-w-md p-3 rounded-lg shadow-sm ${
        isMe
          ? "bg-blue-600 text-white rounded-br-none"
          : "bg-white text-gray-800 rounded-bl-none"
      }`;

      let content = `<p>${msg.text}</p>`;
      if (msg.sender !== state.user.username) {
        content =
          `<p class="text-xs font-bold text-indigo-500 mb-1">${msg.sender}</p>` +
          content;
      }
      content += `<p class="text-xs mt-1 opacity-70 text-right">${new Date(
        msg.timestamp
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>`;

      bubble.innerHTML = content;
      msgDiv.appendChild(bubble);
      container.appendChild(msgDiv);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  },

  handleSendMessage: async (e) => {
    e.preventDefault();
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text || !state.selectedConversationId) return;

    // Optimistic update
    const newMessage = {
      id: Date.now().toString(),
      text: text,
      sender: state.user.username,
      timestamp: new Date().toISOString(),
    };

    const convIndex = state.conversations.findIndex(
      (c) => c.id === state.selectedConversationId
    );
    if (convIndex === -1) return;

    state.conversations[convIndex].messages.push(newMessage);
    app.renderMessages();
    input.value = "";

    // Save to Supabase
    await supabase
      .from("conversations")
      .update({ messages: state.conversations[convIndex].messages })
      .eq("id", state.selectedConversationId);
  },

  // --- CHESS ---
  initChess: () => {
    state.chessGame = new Chess();
    app.drawBoard();
    document.getElementById("chess-status").innerText =
      "Torn de: Blanques (Tu)";
    document.getElementById("ai-thinking").classList.add("hidden");
  },

  resetChessGame: () => {
    app.initChess();
  },

  drawBoard: () => {
    const boardEl = document.getElementById("chessboard");
    boardEl.innerHTML = "";
    const board = state.chessGame.board();

    // Unicode pieces
    const pieces = {
      w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
      b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
    };

    board.forEach((row, rowIndex) => {
      row.forEach((square, colIndex) => {
        const squareDiv = document.createElement("div");
        const isDark = (rowIndex + colIndex) % 2 === 1;
        const squareId = String.fromCharCode(97 + colIndex) + (8 - rowIndex);

        squareDiv.className = `flex items-center justify-center text-5xl md:text-6xl cursor-pointer ${
          isDark
            ? "bg-emerald-700 text-emerald-100"
            : "bg-emerald-100 text-emerald-800"
        }`;

        if (square) {
          const symbol = pieces[square.color][square.type];
          // Si és peça negra, la pintem més fosca o negra per contrast
          if (square.color === "b") squareDiv.classList.add("text-black");
          else squareDiv.classList.add("text-white", "drop-shadow-md");

          squareDiv.innerHTML = `<span class="chess-piece">${symbol}</span>`;
        }

        squareDiv.onclick = () => app.handleSquareClick(squareId);
        boardEl.appendChild(squareDiv);
      });
    });
  },

  handleSquareClick: (squareId) => {
    // Lògica molt simplificada per fer un moviment (clic origen -> clic destí)
    // Per simplicitat en Vanilla JS, utilitzarem "prompt" si no hi ha selecció prèvia visual complexa
    // O millor: intentem moure des de la selecció anterior.

    if (state.isAiThinking) return;

    // Implementació senzilla: primer clic guarda origen, segon fa moviment
    if (!state.selectedSquare) {
      const piece = state.chessGame.get(squareId);
      if (piece && piece.color === "w") {
        state.selectedSquare = squareId;
        // Highlight (visualment no implementat aqui per brevetat, però funcionaria amb classes CSS)
        console.log("Seleccionat:", squareId);
      }
    } else {
      try {
        const move = state.chessGame.move({
          from: state.selectedSquare,
          to: squareId,
          promotion: "q",
        });

        if (move) {
          state.selectedSquare = null;
          app.drawBoard();
          app.checkGameOver();
          if (!state.chessGame.isGameOver()) {
            app.makeAiMove();
          }
        } else {
          state.selectedSquare = null; // Reset si moviment invalid
        }
      } catch (e) {
        state.selectedSquare = null;
      }
    }
  },

  checkGameOver: () => {
    if (state.chessGame.isGameOver()) {
      alert("Partida acabada!");
    }
  },

  makeAiMove: async () => {
    if (!aiClient) {
      // Moviment aleatori si no hi ha API Key
      setTimeout(() => {
        const moves = state.chessGame.moves();
        const move = moves[Math.floor(Math.random() * moves.length)];
        state.chessGame.move(move);
        app.drawBoard();
        document.getElementById("chess-status").innerText = "Torn de: Blanques";
      }, 500);
      return;
    }

    state.isAiThinking = true;
    document.getElementById("ai-thinking").classList.remove("hidden");

    try {
      const model = aiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Ets un motor d'escacs. FEN: ${state.chessGame.fen()}. És el torn de les negres. Retorna NOMÉS el següent millor moviment en notació SAN (ex: "e5"). Sense explicacions.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      state.chessGame.move(text);
    } catch (error) {
      console.error("AI Error:", error);
      // Fallback random
      const moves = state.chessGame.moves();
      if (moves.length > 0)
        state.chessGame.move(moves[Math.floor(Math.random() * moves.length)]);
    } finally {
      state.isAiThinking = false;
      document.getElementById("ai-thinking").classList.add("hidden");
      app.drawBoard();
      document.getElementById("chess-status").innerText = "Torn de: Blanques";
    }
  },
};

// Expose app to window for onclick handlers in HTML
window.app = app;

// Start
app.init();
