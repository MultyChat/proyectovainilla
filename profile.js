let selectedSportsOrder = [];

// Cerrar sesión y redirigir a login.html
document.getElementById('logout-btn').addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    } else {
      window.location.href = "login.html"; // Redirigir a la pantalla de login
    }
  });

function showCustomAlert(message) {
  document.getElementById("custom-alert-message").textContent = message;
  document.getElementById("custom-alert").classList.remove("hidden");
}

function closeCustomAlert() {
  document.getElementById("custom-alert").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("📌 Verificando que el DOM está completamente cargado.");
    const urlParams = new URLSearchParams(window.location.search);
    const profileIdFromUrl = urlParams.get("user");
  
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        window.location.href = "login.html"; // redirige si no hay sesión
        return;
    }
  
    const isOwnProfile = !profileIdFromUrl || profileIdFromUrl === user.id;
    const userId = isOwnProfile ? user.id : profileIdFromUrl;
  
    // 🔄 Cargar perfil (puede ser el propio o el de otro)
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("username, phone_number, avatar_url, favorite_sports, notifications_enabled, gender_category, age_category")
        .eq("id", userId)
        .single();
  
    if (error) {
        console.error("❌ Error al cargar perfil:", error.message);
        return;
    }
    
// Navegación
document.getElementById('home-icon').addEventListener('click', () => {
  window.location.href = "index.html";
});


// Evento para el icono de "Grupo"
document.getElementById("group-icon").addEventListener("click", () => {
    window.location.href = "groups.html"; // Redirige a la página de grupos
  });

document.getElementById('profile-icon').addEventListener('click', () => {
});

// Evento para el icono de "Grupo"
document.getElementById("group-icon").addEventListener("click", () => {
  console.log("👥 Navegando a la sección de grupos...");
  // Aquí puedes redirigir a una página de grupos o mostrar un modal
  // window.location.href = "grupos.html"; // Si quieres redirigir a una nueva página
});

document.getElementById('notification-icon').addEventListener('click', () => {
  showCustomAlert("No tienes notificaciones por ahora.");
});

  document.addEventListener("DOMContentLoaded", async () => {
    console.log("📌 Verificando que el DOM está completamente cargado.");

    setTimeout(() => {
        const homeIcon = document.getElementById('home-icon');
        const searchIcon = document.getElementById('search-icon');
        const groupIcon = document.getElementById('group-icon');
        const notificationIcon = document.getElementById('notification-icon');
        const logoutBtn = document.getElementById('logout-btn');

        if (homeIcon) {
            homeIcon.addEventListener('click', () => {
                window.location.href = "index.html";
            });
        }

        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                showCustomAlert("🔎 Función de búsqueda en desarrollo...");
            });
        }

        if (groupIcon) {
            groupIcon.addEventListener('click', () => {
                showCustomAlert("🚧 Función de grupos en desarrollo...");
            });
        }

        if (notificationIcon) {
            notificationIcon.addEventListener('click', () => {
                showCustomAlert("🔔 No tienes notificaciones por ahora.");
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const { error } = await supabaseClient.auth.signOut();
                if (error) {
                    console.error('❌ Error al cerrar sesión:', error.message);
                } else {
                    window.location.href = "login.html";
                }
            });
        }
    }, 500); // ⏳ Esperamos 500ms para asegurar que el DOM esté cargado
    
});

  // Rellena el formulario
  document.getElementById("username").value = data.username || "";
  document.getElementById("phone-number").value = data.phone_number || "";
const favSports = data.favorite_sports || [];
const checkboxes = document.querySelectorAll('#favorite-sports-checkboxes input[type="checkbox"]');

// 🧠 Restauramos el orden al entrar al perfil
selectedSportsOrder = [...favSports];

checkboxes.forEach(chk => {
  chk.checked = favSports.includes(chk.value);

  chk.addEventListener("change", () => {
    const value = chk.value;
    if (chk.checked) {
      if (!selectedSportsOrder.includes(value)) {
        selectedSportsOrder.push(value);
      }
    } else {
      selectedSportsOrder = selectedSportsOrder.filter(s => s !== value);
    }
    actualizarNumeracionVisual(); // 👈 Llama a función para mostrar #n
  });
});

actualizarNumeracionVisual(); // Mostramos al cargar

function actualizarNumeracionVisual() {
  const checkboxes = document.querySelectorAll('#favorite-sports-checkboxes input[type="checkbox"]');
  checkboxes.forEach(chk => {
    const label = chk.parentElement;
    let badge = label.querySelector(".badge-order");

    const index = selectedSportsOrder.indexOf(chk.value);

    if (!badge) {
      badge = document.createElement("span");
      badge.classList.add("badge-order");
      badge.style.color = "green";
      badge.style.marginLeft = "6px";
      label.appendChild(badge);
    }

    if (chk.checked && index >= 0) {
      badge.textContent = `#${index + 1}`;
    } else {
      badge.textContent = "";
    }
  });
}

  document.getElementById("gender-category").value = data.gender_category || "";
  document.getElementById("age-category").value = data.age_category || "";
  document.getElementById("notifications-enabled").checked = data.notifications_enabled || false;

  const avatarElement = document.getElementById("avatar");
  const navbarProfileIcon = document.getElementById("profile-icon");

  if (data.avatar_url) {
      avatarElement.src = data.avatar_url;
      navbarProfileIcon.src = data.avatar_url;
  } else {
      avatarElement.src = "profile.jpg";
      navbarProfileIcon.src = "profile.jpg";
  }

  // 🔐 Si es otro usuario, deshabilita todos los campos
  if (!isOwnProfile) {
    document.querySelectorAll("#profile-form input, #profile-form select, #profile-form button").forEach(el => {
      el.disabled = true;
      el.style.cursor = "default";
      el.style.backgroundColor = "#e9ecef";
    });

    document.getElementById("avatar-upload").style.display = "none";
  }
});
  
  // Guardar cambios en Supabase
  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const profileIdFromUrl = urlParams.get("user");

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        window.location.href = "login.html";
        return;
    }

    const userId = profileIdFromUrl || user.id;
    const isOwnProfile = userId === user.id;
    const username = document.getElementById("username").value;
    const phoneNumber = document.getElementById("phone-number").value;
    const favoriteSports = selectedSportsOrder;

    const notificationsEnabled = document.getElementById("notifications-enabled").checked;

    const genderCategory = document.getElementById("gender-category").value;
    const ageCategory = document.getElementById("age-category").value;

    const updatedProfile = {
        username,
        phone_number: phoneNumber,
        favorite_sports: favoriteSports,
        notifications_enabled: notificationsEnabled,
        gender_category: genderCategory,
        age_category: ageCategory
    };

    if (!isOwnProfile) {
        document.querySelectorAll("#profile-form input, #profile-form select, #profile-form button").forEach(el => {
          el.disabled = true;
          el.style.cursor = "default";
          el.style.backgroundColor = "#e9ecef";
        });
      
        document.getElementById("avatar-upload").style.display = "none";
      }
      


    // Guardar en Supabase
    const { error } = await supabaseClient
        .from("profiles")
        .upsert([{ id: userId, ...updatedProfile }]); // Usamos `upsert` para actualizar o crear

    if (error) {
        console.error("❌ Error al actualizar perfil:", error.message);
    } else {
        showCustomAlert("✅ Perfil actualizado correctamente.");
    }
});

document.getElementById("avatar-upload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) return;

  const userId = user.id;
  const filePath = `${userId}.jpg`;

  // Subir imagen a Supabase Storage
  const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

  if (uploadError) {
      console.error("❌ Error al subir imagen:", uploadError.message);
      return;
  }

  // Obtener URL pública de la imagen
  const { data } = supabaseClient.storage.from("avatars").getPublicUrl(filePath);
  
  // Guardar URL en la base de datos
  const { error } = await supabaseClient
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", userId);

  if (error) {
      console.error("❌ Error al guardar la imagen:", error.message);
  } else {
    // Actualizar imagen en el perfil y en la barra de navegación
    document.getElementById("avatar").src = data.publicUrl;
    document.getElementById("profile-icon").src = data.publicUrl; // Actualizar en la barra
    console.log("✅ Imagen de perfil actualizada correctamente.");
    }
});

document.getElementById("toggle-sports-btn").addEventListener("click", () => {
    const container = document.getElementById("favorite-sports-checkboxes");
    const button = document.getElementById("toggle-sports-btn");
  
    const isHidden = container.classList.toggle("hidden");
    button.textContent = isHidden ? "Mostrar deportes" : "Ocultar deportes";
  });
  
  // Cuando todo el contenido esté cargado
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
});