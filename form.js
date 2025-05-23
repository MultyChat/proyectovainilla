function showCustomAlert(message) {
  document.getElementById("custom-alert-message").textContent = message;
  document.getElementById("custom-alert").classList.remove("hidden");
}

function closeCustomAlert() {
  document.getElementById("custom-alert").classList.add("hidden");
}

// Función para cargar el formulario en index.html
async function loadForm() {
    try {
        console.log("🔄 Cargando form.html...");
        const response = await fetch('form.html'); // Cargar el formulario externo
        const formHtml = await response.text();
        document.body.insertAdjacentHTML('beforeend', formHtml); // Agrega el formulario al final del body

        console.log("✅ Formulario insertado en el DOM");

        // Esperar a que el formulario se inserte en el DOM antes de manipularlo
        setTimeout(() => {
            const formContainer = document.getElementById("form-container");
            const closeFormBtn = document.getElementById("close-form-btn");
            const addGameBtn = document.getElementById("add-game-btn-top");
            const sportTypeSelect = document.getElementById("sport-type");
            const playerCountInput = document.getElementById("player-count");

            const sportPlayerMap = {
              "Fútbol": 22,
              "Fútbol 7": 14,
              "Fútbol 6": 12,
              "Futsal": 10,
              "Básquetbol": 10,
              "Voleibol": 12,
              "Handbol": 14,
              "Hockey": 12,
              "Tenis": 4,
              "Pádel": 4,
              "Rugby": 30
            };

            sportTypeSelect.addEventListener("change", () => {
              const selectedSport = sportTypeSelect.value;
              const suggestedCount = sportPlayerMap[selectedSport];

              if (suggestedCount) {
                playerCountInput.value = suggestedCount;
                playerCountInput.setAttribute("placeholder", `Sugerido: ${suggestedCount}`);
              }
              });
   
            if (formContainer) {
  formContainer.classList.add("hidden");
  console.log("✅ Formulario cargado y ocultado correctamente");

  if (closeFormBtn) {
    // Si existe al menos el botón de cerrar, asigna eventos mínimos
    closeFormBtn.addEventListener("click", () => {
      formContainer.classList.add("hidden");
      console.log("📌 Formulario ocultado");
    });
  }

  // 👉 Intentar agregar eventos si el botón principal existe
  if (addGameBtn) {
    attachFormEvents(); // con ambos, asigna todo
  } else {
    console.warn("⚠️ Solo se encontró el botón de cerrar. No se asignó evento para abrir desde index.");
  }
}

        
            // ✅ NUEVO BLOQUE: Asignar botón de configuración avanzada
            const toggleBtn = document.getElementById("toggle-advanced-btn");
            const advancedDiv = document.getElementById("advanced-settings");
        
            if (toggleBtn && advancedDiv) {
                toggleBtn.addEventListener("click", () => {
                    advancedDiv.classList.toggle("hidden");
                    toggleBtn.textContent = advancedDiv.classList.contains("hidden")
                        ? "⚙️ Configuración Avanzada"
                        : "🔽 Ocultar Configuración";
                    console.log("🎛 Toggle avanzado ejecutado");
                });
            } else {
                console.warn("⚠️ No se encontró el botón o contenedor avanzado al cargar el DOM dinámico");
            }
        
        }, 200);
         // Esperar 200ms para asegurar que el DOM se actualice

    } catch (error) {
        console.error("❌ Error cargando form.html:", error);
    }
}

// Función para establecer la fecha actual en el campo de fecha
function setTodayDate() {
    setTimeout(() => {
        const dateInput = document.getElementById("game-date");
        if (dateInput) {
            const today = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
            dateInput.value = today; // Asigna la fecha actual
            console.log("📅 Fecha actual establecida:", today);
        } else {
            console.error("❌ No se encontró el input de fecha.");
        }
    }, 500); // Espera un poco más para asegurar que el input esté en el DOM
}

async function loadSportsCenters() {
    const { data, error } = await supabaseClient.from("sportscenters").select("name");
  
    if (error) {
      console.error("❌ Error al cargar centros deportivos:", error.message);
      return;
    }
  
    const datalist = document.getElementById("sports-centers-list");
    datalist.innerHTML = ""; // Limpiar opciones anteriores
  
    data.forEach(center => {
      const option = document.createElement("option");
      option.value = center.name;
      datalist.appendChild(option);
    });
  
    console.log("✅ Centros deportivos cargados:", data);
  }

  async function autocompleteFormWithProfile() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) return;

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("favorite_sports, gender_category, age_category")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return;

  // Establecer el deporte favorito 1
  const favoriteSports = profile.favorite_sports;
  if (Array.isArray(favoriteSports) && favoriteSports.length > 0) {
    const sportTypeSelect = document.getElementById("sport-type");
    if (sportTypeSelect) {
      const index = Array.from(sportTypeSelect.options).findIndex(
        opt => opt.textContent.toLowerCase() === favoriteSports[0].toLowerCase()
      );
      if (index !== -1) {
        sportTypeSelect.selectedIndex = index;
        sportTypeSelect.dispatchEvent(new Event("change")); // actualiza sugerencia de jugadores
      }
    }
  }

  // Categoría de género
  if (profile.gender_category) {
    const genderSelect = document.getElementById("sport-category");
    if (genderSelect) genderSelect.value = profile.gender_category;
  }

  // Si deseas usar edad también
  if (profile.age_category) {
    console.log("Edad preferida:", profile.age_category);
    // Aquí puedes usarlo si luego quieres agregar ese campo en Configuración Avanzada
  }
}

  
// Función para asignar eventos al formulario después de cargarlo
function attachFormEvents() {
    console.log("✅ Eventos asignados correctamente al formulario");

    const formContainer = document.getElementById('form-container');
    const closeFormBtn = document.getElementById('close-form-btn');
    const addGameBtn = document.getElementById('add-game-btn-top');

    if (!formContainer || !closeFormBtn || !addGameBtn) {
        console.error("❌ Error: No se encontraron algunos elementos del formulario.");
        return;
    }

    console.log("✅ Eventos asignados correctamente al formulario");

    // Mostrar formulario al hacer clic en "+"
    addGameBtn.addEventListener('click', async () => {
        formContainer.classList.remove('hidden');
        setTodayDate();
        loadSportsCenters();
        await autocompleteFormWithProfile(); // 👈 Agregado

        console.log("📌 Formulario mostrado");
    });


    // Ocultar formulario al hacer clic en "Cancelar"
    closeFormBtn.addEventListener('click', () => {
        formContainer.classList.add('hidden');
        console.log("📌 Formulario ocultado");
    });

    // Guardar juego en Supabase
document.getElementById('game-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) return;

  const sportscenter = document.getElementById('sports-center').value;
  const gamedate = document.getElementById('game-date').value;
  const gametime = document.getElementById('game-time').value;
  const sporttype = document.getElementById('sport-type').value;
  const fieldnumber = document.getElementById('field-number').value;


// ⛔ Validar duplicación exacta (mismo centro, deporte, fecha, hora y cancha)
const { data: matchingGames, error: matchError } = await supabaseClient
  .from("games")
  .select("id, user_id, sportscenter, sporttype, gamedate, gametime, fieldnumber")
  .eq("gamedate", gamedate)
  .eq("gametime", gametime)
  .eq("sportscenter", sportscenter)
  .eq("sporttype", sporttype);

if (matchError) {
  console.error("❌ Error al verificar duplicación de partido:", matchError.message);
} else {
  const conflicto = matchingGames.find(g => {
    if (g.user_id === user.id) return false; // Ignora si es su propio partido
    return (!fieldnumber && !g.fieldnumber) || (fieldnumber === g.fieldnumber);
  });

  if (conflicto) {
    showCustomAlert(`⚠️ Ya existe otro partido de ${sporttype} en ${sportscenter} el ${gamedate} a las ${gametime}. Selecciona una cancha diferente desde Configuración Avanzada si deseas continuar.`);
    return; // ⛔ Bloquea
  }
}

  // ⏰ Validar conflictos antes de guardar
  const newGameDateTime = new Date(`${gamedate}T${gametime}`);

  const { data: allGamesToday, error: fetchGamesError } = await supabaseClient
    .from("games")
    .select("id, gamedate, gametime, players, sportscenter")
    .eq("gamedate", gamedate);

  if (fetchGamesError) {
    console.error("❌ Error al verificar conflictos de horario:", fetchGamesError.message);
  } else {
    const conflict = allGamesToday.find(g => {
      if (!Array.isArray(g.players) || !g.players.includes(user.id)) return false;

      const existingDateTime = new Date(`${g.gamedate}T${g.gametime}`);
      const diffInMinutes = Math.abs((existingDateTime - newGameDateTime) / (1000 * 60));
      const sameCenter = g.sportscenter === sportscenter;

      if (sameCenter && diffInMinutes < 60) {
        showCustomAlert("⛔ Ya estás inscrito en otro partido en este centro con menos de 1 hora de diferencia. ¡Dale un respiro a tu cuerpo!");
        return true;
      }

      if (!sameCenter && diffInMinutes < 90) {
        alshowCustomAlertert("⛔ Tienes otro partido muy cerca en otra cancha. ¡No queremos verte corriendo de una cancha a otra como Flash!");
        return true;
      }

      return false;
    });

    if (conflict) return; // ❌ Detener creación
  }

  // 🔽 Aquí continúa el flujo de creación normal del partido
  const sportcategory = document.getElementById('sport-category').value;
  const playercount = document.getElementById('player-count').value;
  const gamevalue = document.getElementById('game-value').value;
  const visibility = document.getElementById('game-visibility')?.value || 'public';
  const gameLevel = document.getElementById('game-level')?.value || 'amistoso';
  const confirmedHourSelect = document.getElementById('confirmed-hour');
  let isConfirmed = null;
  if (confirmedHourSelect.selectedIndex > 0) {
    isConfirmed = confirmedHourSelect.value === "true";
  }
  const groupId = document.getElementById("group-id-hidden")?.value;

  const newGame = {
    sportscenter,
    sporttype,
    sportcategory,
    fieldnumber,
    gamedate,
    gametime,
    playercount,
    gamevalue,
    visibility,
    level: gameLevel,
    confirmed: isConfirmed !== null ? isConfirmed : null,
    user_id: user.id,
    players: [user.id],
    ...(groupId ? { group_id: groupId } : {})
  };

  console.log("📤 Enviando datos a Supabase:", newGame);

  const { data, error } = await supabaseClient.from('games').insert([newGame]);

  if (error) {
    console.error("❌ Error al agregar juego:", error.message);
  } else {
    showSuccessMessage("✅ Partido creado con éxito 🎉");
    document.getElementById('game-form').reset();
    setTimeout(() => {
      document.getElementById('form-container').classList.add('hidden');
    }, 1000);
    loadGames();
  }

        setTimeout(() => {
            const toggleBtn = document.getElementById("toggle-advanced-btn");
            const advancedDiv = document.getElementById("advanced-settings");
        
            if (toggleBtn && advancedDiv) {
                toggleBtn.addEventListener("click", () => {
                    advancedDiv.classList.toggle("hidden");
                    toggleBtn.textContent = advancedDiv.classList.contains("hidden")
                        ? "⚙️ Configuración Avanzada"
                        : "🔽 Ocultar Configuración";
                    console.log("🎛 Configuración avanzada alternada");
                });
            } else {
                console.warn("⚠️ No se encontró el botón o div de configuración avanzada");
            }
        }, 300);
        
        
    });
    
    // Función para mostrar alerta de éxito
    function showSuccessMessage(message) {
        const alertBox = document.createElement('div');
        alertBox.className = 'success-alert';
        alertBox.textContent = message;
    
        document.body.appendChild(alertBox);
    
        setTimeout(() => {
            alertBox.remove();
        }, 3000);
    }
}    

// Cargar el formulario cuando la página haya terminado de cargarse
document.addEventListener("DOMContentLoaded", () => {
    console.log("🌍 DOM cargado, llamando a loadForm()");
    loadForm();
});