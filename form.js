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
        
            if (formContainer) {
                formContainer.classList.add("hidden");
                console.log("✅ Formulario cargado y ocultado correctamente");
        
                if (closeFormBtn && addGameBtn) {
                    attachFormEvents(); // Asignar eventos principales
                } else {
                    console.error("⚠️ No se encontraron los botones de abrir/cerrar formulario.");
                }
            } else {
                console.error("❌ Error: No se encontró el elemento #form-container después de cargar.");
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
    addGameBtn.addEventListener('click', () => {
        formContainer.classList.remove('hidden');
        setTodayDate(); // Establece la fecha actual al abrir el formulario
        loadSportsCenters();
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
        // Obtener el usuario actual desde Supabase
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        console.error("❌ Error: Usuario no autenticado.");
        return;
    }
        const sportscenter = document.getElementById('sports-center').value;
        const sporttype = document.getElementById('sport-type').value;
        const sportcategory = document.getElementById('sport-category').value;
        const fieldnumber = document.getElementById('field-number').value;
        const gamedate = document.getElementById('game-date').value;
        const gametime = document.getElementById('game-time').value;
        const playercount = document.getElementById('player-count').value;
        const gamevalue = document.getElementById('game-value').value;
        const visibilityElement = document.getElementById('game-visibility');
        const visibility = visibilityElement ? visibilityElement.value : 'public';
        const gameLevelElement = document.getElementById('game-level');
        const gameLevel = gameLevelElement ? gameLevelElement.value : 'amistoso';
        const confirmedHourSelect = document.getElementById('confirmed-hour');
            let isConfirmed = null;

            if (confirmedHourSelect.selectedIndex > 0) {
            isConfirmed = confirmedHourSelect.value === "true";
            } else {
            isConfirmed = null;
            } 

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
            user_id: user.id,  // Guardar el ID del usuario que crea el juego
            players: [user.id]
        };
        console.log("📤 Enviando datos a Supabase:", newGame);
    
        const { data, error } = await supabaseClient.from('games').insert([newGame]);
    
        if (error) {
            console.error("❌ Error al agregar juego:", error.message);
        } else {
            console.log("✅ Juego agregado correctamente en Supabase:", data);
    
            // Mostrar alerta de éxito
            showSuccessMessage("Juego agregado con éxito 🎉");
    
            // Resetear formulario
            document.getElementById('game-form').reset();
    
            // Ocultar formulario después de 1 segundo
            setTimeout(() => {
                document.getElementById('form-container').classList.add('hidden');
            }, 1000);
    
            // Actualizar la lista de juegos
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