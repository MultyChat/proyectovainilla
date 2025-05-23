let loadGamesTimeout = null;

async function getCurrentUser() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    console.error("❌ Error al obtener usuario:", error?.message);
    return null;
  }
  return user;
}

function showLoginRequiredMessage() {
      const alertBox = document.createElement('div');
      alertBox.className = 'login-alert';
      alertBox.textContent = '🔒 Debes iniciar sesión para continuar.';
    
      document.body.appendChild(alertBox);
    
      setTimeout(() => {
        alertBox.remove();
      }, 3000);
    }
    

// Cerrar sesión y redirigir a login.html
document.getElementById('logout-btn').addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('Error al cerrar sesión:', error.message);
  } else {
    window.location.href = "login.html"; // Redirigir a la pantalla de login
  }
});

// Navegación
document.getElementById('home-icon').addEventListener('click', () => {
  window.location.href = "index.html";
});

document.getElementById('profile-icon').addEventListener('click', () => {
});

document.addEventListener("DOMContentLoaded", async () => {
 
  const user = await getCurrentUser();
    if (!user) return;

    const userId = user.id;
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("❌ Error al obtener la imagen de perfil:", error.message);
        return;
    }

    if (data.avatar_url) {
        document.getElementById("profile-icon").src = data.avatar_url; // Actualizar en la barra
    }
});

// Evento para el icono de "Grupo"
document.getElementById("group-icon").addEventListener("click", () => {
    window.location.href = "groups.html"; // Redirige a la página de grupos
  });
  

document.getElementById('notification-icon').addEventListener('click', () => {
  alert("No tienes notificaciones por ahora.");
});

document.getElementById("tab-joined").addEventListener("click", () => {
  document.getElementById("joined-games-list").classList.remove("hidden");
  document.getElementById("created-games-list").classList.add("hidden");

  document.getElementById("tab-joined").classList.add("active-tab");
  document.getElementById("tab-created").classList.remove("active-tab");
});

document.getElementById("tab-created").addEventListener("click", () => {
  document.getElementById("joined-games-list").classList.add("hidden");
  document.getElementById("created-games-list").classList.remove("hidden");

  document.getElementById("tab-joined").classList.remove("active-tab");
  document.getElementById("tab-created").classList.add("active-tab");
});

function showCustomAlert(message) {
  document.getElementById("custom-alert-message").textContent = message;
  document.getElementById("custom-alert").classList.remove("hidden");
}

function closeCustomAlert() {
  document.getElementById("custom-alert").classList.add("hidden");
}

async function loadAvailablePlayers() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("available_to_play, available_sport")
    .eq("available_to_play", true);

  if (error) return;

  const total = data.length;
  const availableCountElement = document.getElementById("available-count");
  if (availableCountElement) {
    availableCountElement.textContent = total;
  }
  

  // Contador por deporte
  const sportsCount = {};
  data.forEach(p => {
    const sport = (p.available_sport || "otro").toLowerCase();
    sportsCount[sport] = (sportsCount[sport] || 0) + 1;
  });

  const iconMap = {
    futbol: "fa-futbol",
    futbol7: "fa-futbol",
    futbol6: "fa-futbol",
    futsal: "fa-futbol",
    basquetbol: "fa-basketball",
    voleibol: "fa-volleyball",
    handbol: "fa-hand-point-up",
    tenis: "fa-table-tennis-paddle-ball",
    padel: "fa-table-tennis-paddle-ball",
    rugby: "fa-shield-halved",
    otro: "fa-question"
  };
}


async function toggleMyAvailability() {
  const user = await getCurrentUser();
  if (!user) return;


  const { data: profile, error: fetchError } = await supabaseClient
    .from("profiles")
    .select("available_to_play, available_sport")
    .eq("id", user.id)
    .single();

  if (fetchError) return;

  if (profile.available_to_play) {
    // Desmarcar como disponible
    await supabaseClient.from("profiles")
      .update({ available_to_play: false, available_sport: null })
      .eq("id", user.id);
  
    showSuccessMessage("🔴 Has cancelado tu disponibilidad");
    loadAvailablePlayers();
  } else {
    // ✅ Verificar si ya tiene un partido hoy
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en zona local
  
    const { data: gamesToday, error: gameError } = await supabaseClient
      .from("games")
      .select("gamedate, players")
      .eq("gamedate", todayStr);
  
    const yaTieneJuegoHoy = gamesToday?.some(game =>
      Array.isArray(game.players) && game.players.includes(user.id)
    );
  
    if (yaTieneJuegoHoy) {
      showCustomAlert("Ya te encuentras en un partido hoy, prioriza al que asistiras por favor.");
      return; // ⛔ No abrir modal ni continuar
    }
  
    // Si no tiene partido, abrir el modal como siempre
    document.getElementById("sport-modal").classList.remove("hidden");
  }
  

  const isNowAvailable = !profile.available_to_play;
  let selectedSport = profile.available_sport;

  if (isNowAvailable) {
    if (!selectedSport) return;
  } else {
    selectedSport = null; // borrar
  }

  const { error: updateError } = await supabaseClient
    .from("profiles")
    .update({
      available_to_play: isNowAvailable,
      available_sport: selectedSport
    })
    .eq("id", user.id);

  if (!updateError) {
    loadAvailablePlayers(); // actualizar contador global
    showSuccessMessage(`${isNowAvailable ? `🟢 disponible para jugar ${selectedSport}` : "🔴 Has cancelado tu disponibilidad"}`);
  }
}

document.getElementById("confirm-sport-btn").addEventListener("click", async () => {
  const sport = document.getElementById("sport-select").value;
  if (!sport || sport === "Selecciona un deporte") {
    showCustomAlert("⚠️ Debes seleccionar un deporte");
    return;
  }

  const user = await getCurrentUser();
  if (!user) return;


  const { error: updateError } = await supabaseClient.from("profiles")
    .update({ available_to_play: true, available_sport: sport })
    .eq("id", user.id);

  if (updateError) {
    console.error("❌ Error al actualizar perfil:", updateError.message);
    return;
  }

  document.getElementById("sport-modal").classList.add("hidden");
  showSuccessMessage(`🟢 Ahora estás disponible para jugar ${sport}`);
  loadAvailablePlayers();

  // 🔁 Fallback: fuerza recarga si no cambió el DOM
  setTimeout(() => {
    const container = document.getElementById("sports-icons");
    const count = document.getElementById("available-count").textContent;
    if (!container.innerHTML || parseInt(count) === 0) {
      console.warn("♻️ No se actualizó el DOM, recargando...");
      location.reload(); // Fuerza recarga como última opción
    }
  }, 3000);
});

async function limpiarDisponibilidadSiCorresponde() {
  const user = await getCurrentUser(); // usa la función optimizada si ya la implementaste
if (!user || !user.id) {
  console.error("❌ Usuario inválido o sin ID");
  return;
}
  const userId = user.id;

  const { data: perfil, error: perfilError } = await supabaseClient
  .from("profiles")
  .select("available_to_play, available_sport, updated_at")
  .eq("id", user.id)
  .single();

  if (perfilError || !perfil.available_to_play) return;

  // Obtener fecha actual
  const hoy = new Date();
  const hoyStr = hoy.toISOString().split("T")[0];

  // Buscar si tiene un partido hoy
  const { data: juegos } = await supabaseClient
    .from("games")
    .select("gamedate, players")
    .eq("gamedate", hoyStr);

  const estaEnPartidoHoy = juegos?.some(j => (j.players || []).includes(userId));

  // Si está en partido o es otro día desde que marcó disponibilidad
  const actualizacion = new Date(perfil.updated_at);
  const esOtroDia = actualizacion.toISOString().split("T")[0] !== hoyStr;

  if (esOtroDia || estaEnPartidoHoy) {
    // 🔴 Desmarcar disponibilidad
    await supabaseClient
      .from("profiles")
      .update({ available_to_play: false, available_sport: null })
      .eq("id", userId);

    console.log("🔕 Se desactivó disponibilidad automáticamente");
    loadAvailablePlayers(); // Actualizar contador
  }
}


document.getElementById("cancel-sport-btn").addEventListener("click", () => {
  document.getElementById("sport-modal").classList.add("hidden");
});

document.getElementById("show-available-btn").addEventListener("click", async () => {
  const { data, error } = await supabaseClient
  .from("profiles")
  .select("username, available_sport, phone_number, id")  
  .eq("available_to_play", true);

  const list = document.getElementById("available-list");
  list.innerHTML = "";

  if (error) {
    console.error("❌ Error al cargar jugadores disponibles:", error.message);
    return;
  }

  if (data.length === 0) {
    list.innerHTML = "<li>No hay jugadores disponibles</li>";
  } else {
    data.forEach(player => {
      const li = document.createElement("li");
      li.style.marginBottom = "12px";
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.justifyContent = "space-between";
      li.style.gap = "12px";
      li.style.padding = "8px 10px";
      li.style.borderBottom = "1px solid #ccc";
    
      // Nombre + deporte
      const userInfo = document.createElement("a");
      userInfo.href = `profile.html?user=${player.id}`;
      userInfo.textContent = `@${player.username} - ${player.available_sport || "🏃 Otro"}`;
      userInfo.target = "_self"; // o "_blank" si quieres que abra en nueva pestaña
      userInfo.style.textDecoration = "underline";
      userInfo.style.color = "#007bff";
      userInfo.style.fontWeight = "bold";
      userInfo.style.flex = "1";
      userInfo.classList.add("user-link");
    
      // Botón de invitación
      const inviteBtn = document.createElement("button");
      inviteBtn.textContent = "📩 Invitar";
      inviteBtn.style.marginLeft = "8px";
      inviteBtn.style.background = "#28a745";
      inviteBtn.style.color = "white";
      inviteBtn.style.border = "none";
      inviteBtn.style.padding = "6px 10px";
      inviteBtn.style.borderRadius = "5px";
      inviteBtn.style.cursor = "pointer";
      inviteBtn.onclick = () => {
        showCustomAlert(`🔔 Aún no implementado. Aquí puedes invitar a ${player.username} (${player.available_sport}) a un partido.`); 
        // Aquí se puede integrar lógica real más adelante
      };
    
      // Botón de teléfono
      const phoneBtn = document.createElement("button");
      phoneBtn.textContent = player.phone_number ? `📞 ${player.phone_number}` : "❌ Sin número";
      phoneBtn.style.marginLeft = "8px";
      phoneBtn.style.background = "#007bff";
      phoneBtn.style.color = "white";
      phoneBtn.style.border = "none";
      phoneBtn.style.padding = "6px 10px";
      phoneBtn.style.borderRadius = "5px";
      phoneBtn.style.cursor = player.phone_number ? "pointer" : "not-allowed";
      phoneBtn.disabled = !player.phone_number;
    
      li.appendChild(userInfo);
      li.appendChild(inviteBtn);
      li.appendChild(phoneBtn);
      list.appendChild(li);
    });    
  }

  document.getElementById("available-modal").classList.remove("hidden");
});

document.getElementById("close-available-modal").addEventListener("click", () => {
  document.getElementById("available-modal").classList.add("hidden");
});


function formatDateToDMY(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

function formatTimeToHM(timeString) {
  return timeString.slice(0, 5); // Extrae solo las primeras 5 posiciones (hh:mm)
}

// Función para cargar y mostrar los juegos guardados en Supabase
async function loadGames() {
    const user = await getCurrentUser();
    if (!user) return;
  
  
    const { data, error: gamesError } = await supabaseClient.from('games').select('*');

    if (gamesError) {
    console.error("❌ Error al cargar juegos:", gamesError.message);
    return;
    }

    // ✅ Verificar si `data` es `null` o vacío
    if (!data || data.length === 0) {
    console.warn("⚠️ No hay juegos disponibles en la base de datos.");
    return;
    }
  
    // Limpiar contenedores antes de actualizar
    document.querySelector("#today-games .games-container").innerHTML = "";
    document.querySelector("#tomorrow-games .games-container").innerHTML = "";

    // Obtener la fecha de hoy y de mañana
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(today.getDate() + 1);
    const yyyyT = tomorrowDate.getFullYear();
    const mmT = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
    const ddT = String(tomorrowDate.getDate()).padStart(2, '0');
    const tomorrowStr = `${yyyyT}-${mmT}-${ddT}`;
    
    // Organizar los juegos en un objeto con claves por fecha
    const gamesByDate = {};
  
    data.forEach(game => {
        const gameStart = new Date(`${game.gamedate}T${game.gametime}`);
        const now = new Date();

        if (now >= gameStart) {
          // 🔴 Saltar si el partido ya empezó
          return;
        }

        const [year, month, day] = game.gamedate.split('-').map(Number);
        const gameDate = new Date(year, month - 1, day);
        gameDate.setHours(0, 0, 0, 0);
        
        const formattedDate = gameDate.toISOString().split("T")[0];

          
      if (!gamesByDate[formattedDate]) {
        gamesByDate[formattedDate] = [];
      }
      gamesByDate[formattedDate].push(game);
    });
    
    // Ordenar fechas de los juegos
    const sortedDates = [todayStr, tomorrowStr]; // Solo hoy y mañana

  
    // Insertar juegos en las secciones correspondientes
    sortedDates.forEach(date => {
      if (!gamesByDate[date]) return; // ⛔ Saltar si no hay juegos ese día
    
      let sectionContainer =
        date === todayStr
          ? document.querySelector("#today-games .games-container")
          : date === tomorrowStr
          ? document.querySelector("#tomorrow-games .games-container")
          : null;
    
      const tempDate = new Date(date + "T12:00:00"); // 🔹 Fijamos mediodía para evitar desfases
        
      // Ordenar los juegos dentro de la fecha por tiempo restante
      gamesByDate[date].sort((a, b) => {
        const timeA = new Date(`${a.gamedate}T${a.gametime}`) - new Date();
        const timeB = new Date(`${b.gamedate}T${b.gametime}`) - new Date();
        return timeA - timeB;
      });
  
      // Crear tarjetas de partidos y agregarlas a la sección correspondiente
      gamesByDate[date].forEach(game => {
       
        const categoryIcons = {
          masculino: "🤵",
          femenino: "💃",
          mixto: "👫",
          capacidades_diferentes: "♿"
        };
        
        const categoryIcon = categoryIcons[game.sportcategory] || "";
        const isJoined = game.players?.includes(user.id);
        const isCreator = game.user_id === user.id;

        const sportImageMap = {
          "Fútbol": "imagenes/canchas/futbol.png",
          "Fútbol 6": "imagenes/canchas/Futbol 6.png",
          "Fútbol 7": "imagenes/canchas/Futbol 7.png",
          "Futsal": "imagenes/canchas/Futsal.png",
          "Básquetbol": "imagenes/canchas/basquetbol.png",
          "Voleibol": "imagenes/canchas/voleibol.png",
          "Tenis": "imagenes/canchas/tenis.png",
          "Handbol": "imagenes/canchas/handbol.png",
          "Pádel": "imagenes/canchas/padel.png",
          "Rugby": "imagenes/canchas/rugby.png",
          "Hockey": "imagenes/canchas/hockey.png"
        };
        const imageSrc = sportImageMap[game.sporttype] || "imagenes/canchas/default.jpg"; // imagen por defecto
        
        const sportIconMap = {
          "Fútbol": "fa-futbol",
          "Básquetbol": "fa-basketball",
          "Voleibol": "fa-volleyball",
          "Handbol": "fa-handball",
          "Tenis": "fa-table-tennis-paddle-ball",
          "Pádel": "fa-table-tennis-paddle-ball",
          "Rugby": "fa-shield-halved",
          "Hockey": "fa-hockey-puck",
          "Otro": "fa-question"
        };
        
        const gameCard = document.createElement("div");
        gameCard.classList.add("game-card");
        gameCard.innerHTML = `
        <div class="game-card">
        <img class="game-icon" src="${imageSrc}" alt="${game.sporttype}">
        <div class="game-info">
          <p class="sportscenter-text">
          <i class="fa-solid fa-landmark"></i> <strong>${game.sportscenter}</strong>
        </p>
          <p><i class="fa-solid ${sportIconMap[game.sporttype] || 'fa-futbol'}"></i> ${game.sporttype} ${categoryIcon}</p>
          <p>🕒 ${formatTimeToHM(game.gametime)}</p>
          <p>💰 ${game.gamevalue}</p>
        </div>
      </div>
        `;
  
        gameCard.innerHTML += `
          <button class="${isJoined ? 'leave-btn' : 'join-btn'}"
            onclick="${isJoined ? `leaveGame(${game.id})` : `joinGame(${game.id})`}">
            ${isJoined ? "🚫 Desunirme" : "📌 Unirme"}
          </button>
        `;

        // Detecta clic sobre el contenedor pero ignora si el clic fue en un botón
      gameCard.addEventListener("click", (e) => {
        if (!e.target.closest("button")) {
          showPlayersModal(game.id);
        }
      });
  
        sectionContainer.appendChild(gameCard);
      });
    });
    loadMyGames();
}

function safeLoadGames(delay = 300) {
  if (loadGamesTimeout) {
    clearTimeout(loadGamesTimeout); // Si ya hay una programada, la reemplaza
  }

  loadGamesTimeout = setTimeout(() => {
    loadGames();
    loadGamesTimeout = null;
  }, delay); // Espera 300ms por defecto antes de ejecutar
}

function formatTimeRemaining(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Función para editar un juego (solo el creador puede hacerlo)
async function editGame(gameId) {

  // Obtener los datos del juego desde Supabase
  const { data, error } = await supabaseClient.from('games').select('*').eq('id', gameId).single();

  if (error) {
      console.error("❌ Error al obtener el juego:", error.message);
      return;
  }

  // Llenar el formulario de edición con los datos actuales
  document.getElementById('edit-sports-center').value = data.sportscenter;
  document.getElementById('edit-sport-type').value = data.sporttype;
  document.getElementById('edit-game-date').value = data.gamedate;
  document.getElementById('edit-game-time').value = data.gametime;
  document.getElementById('edit-player-count').value = data.playercount;
  document.getElementById('edit-game-value').value = data.gamevalue;

  // Mostrar el modal de edición
  document.getElementById('edit-modal').classList.remove('hidden');

  // Guardar cambios
  document.getElementById('edit-game-form').onsubmit = async (e) => {
      e.preventDefault();

      const updatedGame = {
          sportscenter: document.getElementById('edit-sports-center').value,
          sporttype: document.getElementById('edit-sport-type').value,
          gamedate: document.getElementById('edit-game-date').value,
          gametime: document.getElementById('edit-game-time').value,
          playercount: document.getElementById('edit-player-count').value,
          gamevalue: document.getElementById('edit-game-value').value
      };

      const { error } = await supabaseClient.from('games').update(updatedGame).eq('id', gameId);

      if (error) {
          console.error("❌ Error al actualizar el juego:", error.message);
      } else {
          document.getElementById('edit-modal').classList.add('hidden');
          safeLoadGames();
      }
  };
}
// Asegurar que el botón de cancelar cierre el modal
document.getElementById("close-edit-btn").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.add("hidden"); // Ocultar el modal
});


// Función para eliminar un juego (solo el creador puede hacerlo)
async function deleteGame(gameId) {
  if (confirm("¿Estás seguro de que quieres eliminar este juego?")) {
      const { error } = await supabaseClient.from('games').delete().eq('id', gameId);

      if (error) {
          console.error("❌ Error al eliminar juego:", error.message);
      } else {
          safeLoadGames();
      }
  }
}
async function deleteGameIfStarted(gameId) {
  const { data: game } = await supabaseClient.from('games').select('*').eq('id', gameId).single();
  if (!game) return;

  const gameStartTime = new Date(`${game.gamedate}T${game.gametime}`);
  const currentTime = new Date();

  if (currentTime >= gameStartTime) {
      await supabaseClient.from('games').delete().eq('id', gameId);
      safeLoadGames();
  }
}

// Función para unirse a un juego
async function joinGame(gameId) {
  const user = await getCurrentUser();
  if (!user) return;

  const { data: selectedGame, error: gameError } = await supabaseClient
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (gameError || !selectedGame) {
    console.error("❌ Error al obtener juego:", gameError?.message);
    return;
  }

  // Combina fecha y hora del partido a un objeto Date
  const selectedDateTime = new Date(`${selectedGame.gamedate}T${selectedGame.gametime}`);

  // Buscar otros partidos del mismo día
  const { data: allGamesToday } = await supabaseClient
    .from('games')
    .select('id, gamedate, gametime, players, sportscenter')
    .eq('gamedate', selectedGame.gamedate);

  const conflictGame = allGamesToday?.find(g => {
    if (g.id === selectedGame.id) return false;
    if (!Array.isArray(g.players) || !g.players.includes(user.id)) return false;

    const existingDateTime = new Date(`${g.gamedate}T${g.gametime}`);
    const diffInMinutes = Math.abs((existingDateTime - selectedDateTime) / (1000 * 60));

    const sameCenter = g.sportscenter === selectedGame.sportscenter;

    // 🔸 Si es en mismo centro deportivo, exigir al menos 60 min de diferencia
    if (sameCenter) {
      return diffInMinutes < 60;
    }

    // 🔸 Si es en distinto centro, bloquear si hay menos de 90 minutos
    return diffInMinutes < 90;

  });

  if (conflictGame) {
    showCustomAlert("¡Ey! Ya tienes un partido cerca de esa hora. Mejor no hagas magia... todavía no puedes estar en dos canchas al mismo tiempo 😉");
    return;
  }

  const currentPlayers = Array.isArray(selectedGame.players) ? selectedGame.players.map(p => String(p)) : [];

  if (currentPlayers.includes(user.id.toString())) {
    console.log("🟡 El usuario ya está en el partido");
    return;
  }

  currentPlayers.push(user.id.toString());

  const { data: updatedGame, error } = await supabaseClient
    .from('games')
    .update({ players: currentPlayers })
    .eq('id', gameId)
    .select();

  if (error) {
    console.error("❌ Error al unirse al juego:", error.message);
  } else {
    console.log("✅ Usuario unido al partido:", user.id);
    safeLoadGames();
    loadMyGames();
  }
}

async function leaveGame(gameId) {

  const user = await getCurrentUser();
  if (!user) return;


  // Obtener el juego actual
  const { data: game, error: gameError } = await supabaseClient
      .from('games')
      .select('players')
      .eq('id', gameId)
      .single();

  if (gameError || !game) {
      console.error("❌ Error al obtener juego:", gameError?.message);
      return;
  }

  // Verificar si el usuario está en la lista de jugadores
  const updatedPlayers = game.players.filter(playerId => playerId !== user.id);

  // Actualizar la lista de jugadores en Supabase
  const { error } = await supabaseClient.from('games').update({ players: updatedPlayers }).eq('id', gameId);
  if (error) {
      console.error("❌ Error al salir del juego:", error.message);
  } else {
      safeLoadGames();
      loadMyGames(); // También actualizar "Mis Juegos"
  }
}

// Llamar a `loadGames()` al cargar la página
document.addEventListener("DOMContentLoaded", loadGames);

async function loadMyGames() {
    const user = await getCurrentUser();
    if (!user) return;
  
  
    // Obtener todos los juegos de la base de datos
    const { data, error } = await supabaseClient.from('games').select('*');
  
    if (error) {
        console.error("❌ Error al cargar juegos:", error.message);
        return;
    }
    
  
    const joinedGamesContainer = document.getElementById('joined-games-list');
    const createdGamesContainer = document.getElementById('created-games-list');
    joinedGamesContainer.innerHTML = ''; // Limpiar antes de cargar
    createdGamesContainer.innerHTML = ''; // Limpiar antes de cargar
  
    data.forEach(game => {
      const gameStart = new Date(`${game.gamedate}T${game.gametime}`);
      const now = new Date();
    
      if (now >= gameStart) return; // ⚠️ Ocultar partido si ya inició
      
        const gameCard = document.createElement('div');
        gameCard.classList.add('game-card');
  
        gameCard.innerHTML = `
            <h3>⚽ ${game.sporttype} (${game.sportcategory})</h3>
            <p><i class="fa-solid fa-landmark"></i> ${game.sportscenter}</p>
            <p>📅 ${formatDateToDMY(game.gamedate)} 🕒 ${formatTimeToHM(game.gametime)}</p>
            <p>👥 ${game.players?.length || 0} jugadores inscritos</p>
        `;
  
        if (game.user_id === user.id) {
          const gameCardForCreated = gameCard.cloneNode(true);
        
          const actionContainer = document.createElement("div");
          actionContainer.classList.add("card-actions");
        
          // Botón Editar
          const editBtn = document.createElement("button");
          editBtn.classList.add("edit-btn");
          editBtn.innerHTML = `<i class="fa-solid fa-pen"></i>`;
          editBtn.onclick = () => editGame(game.id);
        
          // Botón Eliminar
          const deleteBtn = document.createElement("button");
          deleteBtn.classList.add("delete-btn");
          deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
          deleteBtn.onclick = () => deleteGame(game.id);
        
          // 🔍 Botón Ver
          const viewBtn = document.createElement("button");
          viewBtn.classList.add("view-btn");
          viewBtn.innerHTML = `<i class="fa-solid fa-eye"></i>`;
          viewBtn.onclick = () => showPlayersModal(game.id);
        
          // Agregar todos los botones
          actionContainer.appendChild(deleteBtn);
          actionContainer.appendChild(editBtn);
          actionContainer.appendChild(viewBtn);
        
          gameCardForCreated.appendChild(actionContainer);
          createdGamesContainer.appendChild(gameCardForCreated);
        }
        
         
        if (game.players?.includes(user.id)) {
          const myCard = gameCard.cloneNode(true);
        
          // Elimina botones existentes tipo .card-actions si vienen clonados
          const existingActions = myCard.querySelector(".card-actions");
          if (existingActions) {
            existingActions.remove();
          }
        
          // Crear contenedor para botón Ver
          const footer = document.createElement("div");
          footer.classList.add("card-actions");
        
          const viewBtn = document.createElement("button");
          viewBtn.classList.add("view-btn");
          viewBtn.innerHTML = `<i class="fa-solid fa-eye"></i>`;
          viewBtn.onclick = () => showPlayersModal(game.id);
        
          footer.appendChild(viewBtn);
        
          // 🔥 Finalmente, insertamos al final del card
          myCard.appendChild(footer);
        
          joinedGamesContainer.appendChild(myCard);
        }
    });
     // Mostrar mensajes si están vacíos
        // 🔹 Eliminar mensaje si ya hay partidas unidas
        const joinedMessage = joinedGamesContainer.querySelector('.empty-message');
        if (joinedGamesContainer.children.length > 0 && joinedMessage) {
          joinedMessage.remove();
        }

        // 🔹 Eliminar mensaje si ya hay partidos creados
        const createdMessage = createdGamesContainer.querySelector('.empty-message');
        if (createdGamesContainer.children.length > 0 && createdMessage) {
          createdMessage.remove();
        }

        // 🔸 Mostrar mensaje si siguen vacíos (como fallback)
        if (joinedGamesContainer.children.length === 0) {
          joinedGamesContainer.innerHTML = `
            <div class="empty-message">
              Aún no te has unido a ningún partido.<br>
              ¡Únete a uno y ve a la hora indicada!, no olvides contactar al anfitrión.
            </div>`;
        }

        if (createdGamesContainer.children.length === 0) {
          createdGamesContainer.innerHTML = `
            <div class="empty-message">
              Organiza tu primer partido y elige cancha, hora y jugadores.<br>
              Tu sección de partidos creados está vacía. ¿Agendamos uno?
            </div>`;
        }        
  }

  function setModalField(value, textId, wrapperId, invalidOptions = []) {
    const textElem = document.getElementById(textId);
    const wrapperElem = document.getElementById(wrapperId);
  
    if (
      value &&
      value !== "" &&
      !invalidOptions.includes(value)
    ) {
      textElem.textContent = value;
      wrapperElem.style.display = "block";
    } else {
      wrapperElem.style.display = "none";
    }
  }
  

  async function showPlayersModal(gameId) {
    const { data: game, error } = await supabaseClient
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
  
    if (error || !game) {
      console.error("❌ Error al obtener el juego:", error?.message);
      return;
    }
  
    const user = (await supabaseClient.auth.getUser()).data.user;
    const isCreator = user.id === game.user_id;
  
    const total = game.playercount;
    const allPlayers = game.players || [];
  
    // Obtener todos los perfiles
    const { data: perfiles, error: perfilesError } = await supabaseClient
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', allPlayers);
      
    if (perfilesError) {
      console.error("❌ Error al obtener jugadores:", perfilesError.message);
      return;
    }

    // Mostrar info del partido
    const sportscenterEl = document.getElementById("modal-sportscenter");
    if (sportscenterEl) sportscenterEl.textContent = game.sportscenter;
    
    const dateEl = document.getElementById("modal-date");
    if (dateEl) dateEl.textContent = game.gamedate;
    
    const timeEl = document.getElementById("modal-time");
    if (timeEl) timeEl.textContent = game.gametime;
    
    const visibilityEl = document.getElementById("modal-visibility");
    if (visibilityEl) visibilityEl.textContent = game.visibility === "public" ? "Público" : "Privado";
    
    const playerCountEl = document.getElementById("modal-players-count");
    if (playerCountEl) playerCountEl.textContent = `${(game.players || []).length} / ${game.playercount}`;
    
    const jerseyColors = game.jersey_colors || { teamA: "#007bff", teamB: "#dc3545" };

    setModalField(game.sportcategory, "modal-category", "modal-category-wrapper", ["Categoría", ""]);
    setModalField(game.fieldnumber, "modal-field", "modal-field-wrapper", ["Cancha", ""]);
    setModalField(game.level, "modal-level", "modal-level-wrapper", ["Nivel", ""]);

    if (game.confirmed === true) {
      setModalField("Sí", "modal-confirmed", "modal-confirmed-wrapper");
    } else if (game.confirmed === false) {
      setModalField("No", "modal-confirmed", "modal-confirmed-wrapper");
    } else {
      document.getElementById("modal-confirmed-wrapper").style.display = "none";
    }
    
    document.getElementById("jersey-a").style.backgroundColor = jerseyColors.teamA;
    document.getElementById("jersey-b").style.backgroundColor = jerseyColors.teamB;

    document.getElementById("color-picker-a").value = jerseyColors.teamA;
    document.getElementById("color-picker-b").value = jerseyColors.teamB;

    let teamOrder = game.team_order;

    if (!teamOrder || !Array.isArray(teamOrder.teamA) || !Array.isArray(teamOrder.teamB)) {
      // Primera vez o formato incorrecto, repartimos desde cero
      const mitad = Math.ceil(allPlayers.length / 2);
      teamOrder = {
        teamA: allPlayers.slice(0, mitad),
        teamB: allPlayers.slice(mitad)
      };
    
      // Guardar la repartición inicial en la BD
      await updateTeamOrder(gameId, teamOrder);
    }  
    // ← Cantidad de jugadores solicitados en total
    const totalPlayers = game.players_number || total;

    // ← Calcular máximo por equipo
    const maxTeamA = Math.ceil(totalPlayers / 2);
    const maxTeamB = Math.floor(totalPlayers / 2);

    // ← Contar cuántos jugadores reales ya hay en cada equipo
    const realTeamA = teamOrder.teamA.filter(p => p !== null).length;
    const realTeamB = teamOrder.teamB.filter(p => p !== null).length;

    // ← Rellenar con vacantes hasta llegar al máximo correspondiente
    for (let i = realTeamA; i < maxTeamA; i++) {
      teamOrder.teamA.push(null);
    }
    for (let i = realTeamB; i < maxTeamB; i++) {
      teamOrder.teamB.push(null);
    }

    const teamAList = document.getElementById("team-a-list");
    const teamBList = document.getElementById("team-b-list");
    teamAList.innerHTML = "";
    teamBList.innerHTML = "";
  
    // Función auxiliar para crear fila de jugador
    function createPlayerItem(id, index, team) {
      let profile = null;
        if (id !== null) {
          profile = perfiles.find(p => p.id === id);
        }
      const li = document.createElement("li");
      li.classList.add("player-item");
      
      const profileLink = id ? `profile.html?user=${id}` : "#";
      const avatarUrl = profile?.avatar_url || "https://ui-avatars.com/api/?name=V&background=eee&color=999";

      li.innerHTML = `
        <div class="player-box">
          <div class="player-card simple">
            <span class="player-plain-number">${index + 1}.</span>
            <a href="${profileLink}" class="player-link" target="_self">
              <img src="${avatarUrl}" class="player-avatar" alt="avatar">
            </a>
            <a href="${profileLink}" class="player-name" target="_self">
              ${profile?.username || "🕳 Vacante"}
            </a>
          </div>
          ${isCreator && profile ? `
            <button class="move-btn" onclick="handlePlayerMove('${id}', '${team}', ${gameId})">
            <i class="fa-solid ${team === "A" ? "fa-arrow-right" : "fa-arrow-left"}"></i>
          </button>
          ` : ""}
        </div>
      `;
      return li;
    }
  
    // Renderizar equipos
    teamOrder.teamA.forEach((id, i) => {
      teamAList.appendChild(createPlayerItem(id, i, "A"));
    });
  
    teamOrder.teamB.forEach((id, i) => {
      teamBList.appendChild(createPlayerItem(id, i, "B"));
    });
  
    document.getElementById("players-modal").classList.remove("hidden");
    const colorPickerA = document.getElementById("color-picker-a");
  const colorPickerB = document.getElementById("color-picker-b");

// Mostrar color actual
colorPickerA.value = jerseyColors.teamA;
colorPickerB.value = jerseyColors.teamB;

// Mostrar visual
document.getElementById("jersey-a").style.backgroundColor = jerseyColors.teamA;
document.getElementById("jersey-b").style.backgroundColor = jerseyColors.teamB;

if (isCreator) {
  colorPickerA.disabled = false;
  colorPickerB.disabled = false;

  colorPickerA.addEventListener("input", (e) => {
    document.getElementById("jersey-a").style.backgroundColor = e.target.value;
  });
  colorPickerB.addEventListener("input", (e) => {
    document.getElementById("jersey-b").style.backgroundColor = e.target.value;
  });

  colorPickerA.addEventListener("change", async (e) => {
    const color = e.target.value;
    await supabaseClient.from("games")
      .update({ jersey_colors: { teamA: color, teamB: colorPickerB.value } })
      .eq("id", gameId);
  });

  colorPickerB.addEventListener("change", async (e) => {
    const color = e.target.value;
    await supabaseClient.from("games")
      .update({ jersey_colors: { teamA: colorPickerA.value, teamB: color } })
      .eq("id", gameId);
  });

} else {
  // ❌ Desactivar para usuarios no creadores
  colorPickerA.disabled = true;
  colorPickerB.disabled = true;
}
}  

let moveInProgress = false;

function handlePlayerMove(playerId, currentTeam, gameId) {
  if (moveInProgress) return; // ⛔ Previene múltiples clics
  moveInProgress = true;

  supabaseClient
    .from('games')
    .select('team_order')
    .eq('id', gameId)
    .single()
    .then(async ({ data, error }) => {
      if (error || !data) {
        console.error("❌ Error al obtener orden:", error?.message);
        moveInProgress = false; // 🔁 Rehabilita si falla
        return;
      }

      const teamOrder = data.team_order || { teamA: [], teamB: [] };

      // ✅ Eliminar el jugador de ambos equipos antes de mover
      teamOrder.teamA = teamOrder.teamA.filter(pid => pid !== playerId);
      teamOrder.teamB = teamOrder.teamB.filter(pid => pid !== playerId);

      // ✅ Insertar en el equipo opuesto
      if (currentTeam === "A") {
        teamOrder.teamB.push(playerId);
      } else {
        teamOrder.teamA.push(playerId);
      }

      await updateTeamOrder(gameId, teamOrder);
      moveInProgress = false;

      showPlayersModal(gameId); // Recargar con nuevo orden
    });
}

  async function updateTeamOrder(gameId, newOrder) {
    const { error } = await supabaseClient
      .from("games")
      .update({ team_order: newOrder })
      .eq("id", gameId);
  
    if (error) {
      console.error("❌ Error al guardar el orden de equipos:", error.message);
    } else {
    }
  }
  
  document.getElementById("close-players-modal").addEventListener("click", () => {
    document.getElementById("players-modal").classList.add("hidden");
  });
    
// Cargar mis juegos al iniciar
document.addEventListener("DOMContentLoaded", loadMyGames);
document.getElementById("available-counter").addEventListener("click", toggleMyAvailability);

async function detectUserCity() {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    const city = data.city || "Ciudad desconocida";
    document.getElementById("user-location").textContent = city;
  } catch (error) {
    console.error("❌ Error al detectar ciudad:", error);
    document.getElementById("user-location").textContent = "Ubicación desconocida";
  }
}

const addGameTopBtn = document.getElementById("add-game-btn-top");
if (addGameTopBtn) {
  addGameTopBtn.addEventListener("click", () => {
    const formContainer = document.getElementById("form-container");
    if (formContainer) {
      formContainer.classList.remove("hidden");
      setTodayDate();
    }
  });
}

function showSuccessMessage(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'success-alert';
  alertBox.textContent = message;

  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.remove();
  }, 3000);
}


document.addEventListener("DOMContentLoaded", () => {
  loadGames();
  loadAvailablePlayers();
  limpiarDisponibilidadSiCorresponde();
  loadMyGames();
  loadSportscentersCarousel();
  detectUserCity();

  // Listeners relacionados
  const addGameTopBtn = document.getElementById("add-game-btn-top");
  if (addGameTopBtn) {
    addGameTopBtn.addEventListener("click", () => {
      document.getElementById("add-game-btn-top").click();
    });
  }

  // Canal de disponibilidad
  supabaseClient
    .channel("available_players_channel")
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "profiles"
    }, (payload) => {
      loadAvailablePlayers();
    }).subscribe();
});

// Cuando todo el contenido esté cargado
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
});

async function loadSportscentersCarousel() {
  const { data, error } = await supabaseClient
  .from("sportscenters")
  .select("name, city, address, phone, type");

  if (error) {
    console.error("❌ Error al cargar centros:", error.message);
    return;
  }

  const container = document.getElementById("sportscenters-list");
  container.innerHTML = "";

  data.forEach(center => {
    const card = document.createElement("div");
    card.className = "sportscenter-card";
  
    // Ruta de icono por tipo
    let iconPath = "imagenes/canchas/sportscenter-icon.png"; // Default
  
    // Usa el campo 'type' si existe
    if (center.type === "estadio") {
      iconPath = "imagenes/canchas/sportscenter-icon-stadium.png";
    } else if (center.type === "cancha") {
      iconPath = "imagenes/canchas/sportscenter-icon-cancha.png";
    }
    card.innerHTML = `
  <img src="${iconPath}" class="sportscenter-icon" alt="Icono Centro Deportivo">
  <h3>${center.name}</h3>
  <p>${center.city || "Ciudad desconocida"}</p>
`;
// 🔴 Aquí agregamos el evento para abrir modal al hacer clic en la tarjeta
card.addEventListener("click", () => {
  document.getElementById("center-modal-name").textContent = center.name;
  document.getElementById("center-modal-address").textContent = center.address || center.city;

  // Llamada
  const callBtn = document.getElementById("center-call-btn");
  callBtn.href = `tel:${center.phone || ""}`;
  callBtn.textContent = `📞 Llamar${center.phone ? ` (${center.phone})` : ''}`;
  callBtn.style.pointerEvents = center.phone ? "auto" : "none";
  callBtn.style.backgroundColor = center.phone ? "#28a745" : "#aaa";

  // Botón para abrir formulario con centro precargado
  const goBtn = document.getElementById("center-go-btn");
  goBtn.onclick = () => {
    const formContainer = document.getElementById("form-container");
    const input = document.getElementById("sports-center");
    if (formContainer && input) {
      input.value = center.name;
      formContainer.classList.remove("hidden");
      setTodayDate();
      document.getElementById("center-modal").classList.add("hidden");
    }
  };
  document.getElementById("center-close-btn").addEventListener("click", () => {
  document.getElementById("center-modal").classList.add("hidden");
});

  document.getElementById("center-modal").classList.remove("hidden");
});

container.appendChild(card);
  
  const mapsQuery = encodeURIComponent(`${center.name}, ${center.address || center.city}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  card.innerHTML = `
    <img src="${iconPath}" class="sportscenter-icon" alt="Icono Centro Deportivo">
    <h3>${center.name}</h3>
    <p><a href="${mapsUrl}" target="_blank" style="color:#ccc; text-decoration:underline;">
      ${center.address || center.city}
    </a></p>
  `;

    container.appendChild(card);
  });  
  

  console.log("✅ Carrusel de centros deportivos cargado:", data);
}
