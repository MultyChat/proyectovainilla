let currentGroupId = null;
let messageChannel = null;

document.addEventListener("DOMContentLoaded", async () => {
  const user = await supabaseClient.auth.getUser();
  if (!user.data.user) {
    window.location.href = "login.html";
    return;
  }

  // Mueve aquí los listeners que estaban antes arriba
  document.getElementById('home-icon')?.addEventListener('click', () => {
    window.location.href = "index.html";
  });

  document.getElementById('notification-icon')?.addEventListener('click', () => {
    alert("No tienes notificaciones por ahora.");
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    } else {
      window.location.href = "login.html";
    }
  });

  document.getElementById("create-group-btn")?.addEventListener("click", createGroup);

  loadGroups(); // ← esto sigue igual
});

async function loadGroups() {
    const { data, error } = await supabaseClient
  .from("groups")
  .select("*, profiles:owner_id(username)");

    if (error) {
        console.error("Error al cargar grupos:", error.message);
        return;
    }

    const container = document.getElementById("groups-container");
    container.innerHTML = ""; // Limpiar antes de cargar

    data.forEach(group => {
        const div = document.createElement("div");
        div.classList.add("group-card");
        const owner = group.profiles?.username || "Desconocido";

  div.innerHTML = `
    <h3>${group.name}</h3>
    <div class="group-meta">
      <span>📅 Creado el: ${new Date(group.created_at).toLocaleDateString()}</span>
      <span>👑 Propietario: @${owner}</span>
    </div>
    <button onclick="joinGroup('${group.id}')">Unirse</button>
  `;

  container.appendChild(div);
    });

    console.log("✅ Grupos cargados:", data);
}

async function createGroup() {
    const groupName = prompt("Ingresa el nombre del grupo:");
    if (!groupName) return;

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        console.error("❌ Error: Usuario no autenticado.");
        return;
    }

    const { data, error } = await supabaseClient.from("groups").insert([{ name: groupName, owner_id: user.id }]);
    if (error) {
        console.error("❌ Error al crear grupo:", error.message);
    } else {
        console.log("✅ Grupo creado:", data);
        loadGroups();
    }
}


// Función para unirse y abrir modal
async function joinGroup(groupId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
  
    const { data: existing } = await supabaseClient
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id);
  
    if (existing.length === 0) {
      await supabaseClient.from("group_members").insert([{ group_id: groupId, user_id: user.id }]);
      console.log("✅ Usuario unido al grupo.");
    }
  
    openGroupModal(groupId);
  }
  


  // Abrir ventana modal del grupo
  function openGroupModal(groupId) {
    currentGroupId = groupId;
    document.getElementById("group-modal").classList.remove("hidden");
  
    setTimeout(async () => {
      // Verificar si el usuario es el dueño del grupo
      const { data: { user } } = await supabaseClient.auth.getUser();
      const { data: group } = await supabaseClient.from("groups").select("owner_id").eq("id", groupId).single();
  
      const isOwner = group && group.owner_id === user.id;
  
      showChatView(); // Asegura que DOM esté listo
  
      // Si es el dueño, agregamos el botón
      if (isOwner) {
        const modalBody = document.getElementById("modal-body");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑 Eliminar Grupo";
        deleteBtn.style.background = "#dc3545";
        deleteBtn.style.color = "white";
        deleteBtn.style.marginTop = "20px";
        deleteBtn.style.padding = "10px";
        deleteBtn.onclick = () => deleteGroup(groupId);
  
        modalBody.appendChild(deleteBtn);
      }
    }, 10);
  }
  


  
  
  // Cerrar el modal
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("group-modal").classList.add("hidden");
  });
  
  // Switch entre vistas
  document.getElementById("switch-games").addEventListener("click", () => {
  setActiveSwitch("games");
  showGamesView();
});

  document.getElementById("switch-chats").addEventListener("click", () => {
    setActiveSwitch("chats");
    showChatView();
  });
  
  document.getElementById("switch-members").addEventListener("click", () => {
    setActiveSwitch("members");
    showMembersView();
  });

  
function setActiveSwitch(view) {
  document.getElementById("switch-games").classList.remove("active-switch");
  document.getElementById("switch-chats").classList.remove("active-switch");
  document.getElementById("switch-members").classList.remove("active-switch");
  

  if (view === "games") {
    document.getElementById("switch-games").classList.add("active-switch");
  } else if (view === "chats") {
    document.getElementById("switch-chats").classList.add("active-switch");
  } else if (view === "members") {
    document.getElementById("switch-members").classList.add("active-switch");
  }
}

function showGamesView() {
  const modalBody = document.getElementById("modal-body");

  modalBody.innerHTML = `
    <h3>📅 Partidos del Grupo</h3>
    <button id="create-game-inside-group" style="margin-bottom: 15px; padding: 10px 15px; background: #28a745; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
      ➕ Crear Partido
    </button>
    <div class="group-games-list">
      <p style="font-style: italic;">Aquí se mostrarán los partidos de este grupo.</p>
    </div>
  `;

  document.getElementById("create-game-inside-group").addEventListener("click", () => {
    const formContainer = document.getElementById("form-container");
    const groupField = document.getElementById("group-id-hidden");
    if (formContainer && groupField) {
      groupField.value = currentGroupId; // 👈 insertamos el grupo actual
      formContainer.classList.remove("hidden");
      setTodayDate();
    }
  });
}



  async function loadMessages(groupId) {
    if (!groupId) {
      console.warn("❌ No se proporcionó un groupId válido");
      return;
    }

    //modificado 14/04
    const { data: { user } } = await supabaseClient.auth.getUser();

  
    const { data, error } = await supabaseClient
      .from("group_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
  
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
  
    if (error) {
      console.error("❌ Error al cargar mensajes:", error.message);
      return;
    }
  
    data.forEach(msg => {
      const isMine = msg.user_id === user.id;
      const p = document.createElement("p");
      p.classList.add("chat-bubble");
      p.classList.add(isMine ? "mine" : "theirs");
      p.textContent = msg.content;
      chatBox.appendChild(p);
    });
  
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  

  function showChatView() {
    const modalBody = document.getElementById("modal-body");
    modalBody.innerHTML = `
      <div id="chat-box" style="height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
      <div style="display: flex; margin-top: 10px; gap: 10px;">
        <input type="text" id="chat-input" placeholder="Escribe un mensaje..." style="flex:1; padding: 10px;">
        <button id="send-btn" style="padding: 10px 15px; background: #28a745; color: white; border: none;">Enviar</button>
      </div>
    `;
  
    // ✅ Primero renderiza el HTML
    loadMessages(currentGroupId);        // Carga anteriores
    subscribeToMessages(currentGroupId); // Luego activa el canal
  
    document.getElementById("send-btn").addEventListener("click", async () => {
      const content = document.getElementById("chat-input").value.trim();
      if (!content) return;
  
      const { data: { user } } = await supabaseClient.auth.getUser();
      await supabaseClient.from("group_messages").insert({
        group_id: currentGroupId,
        user_id: user.id,
        content
      });
  
      document.getElementById("chat-input").value = "";
    });

    //modificado 15/04
    document.getElementById("chat-input").addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // evita salto de línea
    
        const content = document.getElementById("chat-input").value.trim();
        if (!content) return;
    
        const { data: { user } } = await supabaseClient.auth.getUser();
        await supabaseClient.from("group_messages").insert({
          group_id: currentGroupId,
          user_id: user.id,
          content
        });
    
        document.getElementById("chat-input").value = "";
      }
    });
    
  }
  

 async function subscribeToMessages(groupId) {
    const chatBox = document.getElementById("chat-box");
    // 🔌 Cierra canal anterior si existe
    if (messageChannel) {
      supabaseClient.removeChannel(messageChannel);
      console.log("🧹 Canal anterior cerrado");
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!chatBox) {
      console.warn("⛔ No se encontró #chat-box al momento de insertar mensaje.");
      return;
    }

  
    // 🛰️ Crear nuevo canal de tiempo real
    messageChannel = supabaseClient
      .channel("group_messages_channel_" + groupId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages"
        },
        (payload) => {
          console.log("📩 Nuevo mensaje en tiempo real:", payload);
  
          try {
            if (payload.new.group_id !== groupId) {
              console.warn("⚠️ Mensaje recibido de otro grupo, ignorado.");
              return;
            }
  
            const msg = payload.new.content;
            if (!msg) throw new Error("Mensaje vacío");
  
            const chatBox = document.getElementById("chat-box");
            if (!chatBox) throw new Error("#chat-box no encontrado");

            //modificado 15/04
            const currentUserId = user.id; // ⚠️ user debe estar definido previamente
            const isMine = payload.new.user_id === currentUserId;

  
            const p = document.createElement("p");
            p.classList.add("chat-bubble");
            p.classList.add(isMine ? "mine" : "theirs");
            p.textContent = msg;
            chatBox.appendChild(p);
            chatBox.scrollTop = chatBox.scrollHeight;
  
            console.log("✅ Mensaje agregado al chat");
          } catch (err) {
            console.error("❌ Error al procesar mensaje:", err.message);
          }
        }
      )
      .subscribe(); // ❗ SIN argumentos aquí
  }
  
  
    

  

  
  
  // Vista: miembros
  async function showMembersView() {
    const modalBody = document.getElementById("modal-body");
  
    const { data: members } = await supabaseClient
      .from("group_members")
      .select("user_id")
      .eq("group_id", currentGroupId);
  
    const ids = members.map(m => m.user_id);
  
    const { data: users } = await supabaseClient
      .from("profiles")
      .select("id, username")
      .in("id", ids);
  
    modalBody.innerHTML = "<h4>Miembros del grupo:</h4><ul>" +
      users.map(u => `<li>@${u.username}</li>`).join("") + "</ul>";
  }
  


  // funcion para eliminar grupo
  async function deleteGroup(groupId) {
    if (!confirm("¿Eliminar este grupo permanentemente?")) return;
  
    const { error } = await supabaseClient.from("groups").delete().eq("id", groupId);
  
    if (error) {
      console.error("❌ Error al eliminar grupo:", error.message);
      alert("❌ No se pudo eliminar el grupo.");
    } else {
      alert("✅ Grupo eliminado correctamente.");
      document.getElementById("group-modal").classList.add("hidden");
      loadGroups(); // refrescar lista
    }
  }
  
  // Cuando todo el contenido esté cargado
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
});  