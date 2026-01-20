import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURACIÓ ---
const SUPABASE_URL = "https://hocwnqqdyyinjrtczhdw.supabase.co";
const SUPABASE_KEY = "sb_publishable_X_TrrWex0GfBLIzbKFp1Cg_Xa97mziS";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- ICONES SVG ---
const ICONS = {
  user: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.108a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.642Z" /></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H4.5a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>',
  role: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-8 w-8 text-blue-600"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /></svg>',
};

// --- ESTAT GLOBAL ---
const state = {
  currentUser: null,
  allUsers: [],
  conversations: [],
  currentView: "loading",
  selectedConversationId: null,
};

// --- DOM ELEMENTS ---
const views = {
  loading: document.getElementById("loading-view"),
  login: document.getElementById("login-view"),
  dashboard: document.getElementById("dashboard-view"),
  chat: document.getElementById("chat-view"),
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
  if (views[viewName]) {
    views[viewName].classList.remove("hidden");
  }
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
  content.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Benvingut, ${state.currentUser.name}!</h2>
        <p class="text-gray-600">Utilitza el menú superior per accedir al xat o tancar la sessió.</p>
    `;
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

// --- CAMERA & MIC (Implementació bàsica per a demostració) ---
document.getElementById("camera-btn").addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    // Simulem captura instantània per no complicar el codi HTML amb més modals
    await new Promise((r) => setTimeout(r, 1000));

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

// Iniciar app
init();
