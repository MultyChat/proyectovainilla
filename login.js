// 1. Referencias a elementos del DOM
const loginContainer = document.getElementById('login-container');
const homeContainer = document.getElementById('home-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const logoutBtn = document.getElementById('logout-btn');
const googleLoginBtn = document.getElementById('google-login-btn');

// 2. Funciones auxiliares para mostrar/ocultar secciones
function showLogin() {
  loginContainer.style.display = 'block';
  homeContainer.style.display = 'none';
}

function showHome() {
  loginContainer.style.display = 'none';
  homeContainer.style.display = 'block';
}

// 3. Manejo de sesión: verificar si hay una sesión activa
async function checkSession() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  
  if (error) {
    console.error('❌ Error al obtener la sesión:', error.message);
    return;
  }
  
  if (session) {
    console.log("✅ Sesión activa, redirigiendo...");
    window.location.href = "index.html";
  } else {
    showLogin();
  }
}

// 4. Manejo de redirección OAuth (Google)
async function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = params.get("access_token");

  if (accessToken) {
    console.log("🔑 Token capturado:", accessToken);

    // Guardar el token en el almacenamiento local
    localStorage.setItem("supabase_access_token", accessToken);

    // Limpiar la URL eliminando el fragmento con el token
    window.history.replaceState({}, document.title, window.location.pathname);  

    // Establecer la sesión en Supabase
    const { data, error } = await supabaseClient.auth.setSession({
      access_token: accessToken
    });

    if (error) {
      console.error("❌ Error al establecer la sesión:", error.message);
    } else {
      console.log("✅ Sesión establecida correctamente:", data);
      window.location.href = "index.html"; // Redirigir al home
    }
  }
}

document.addEventListener("DOMContentLoaded", handleOAuthRedirect);

// 5. Evento: Inicio de sesión con email y contraseña
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMessage.textContent = '';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("❌ Error al iniciar sesión:", error.message);
    errorMessage.textContent = error.message;
  } else {
    console.log("✅ Inicio de sesión exitoso");
    window.location.href = "index.html";
  }
});

// 6. Evento: Inicio de sesión con Google
googleLoginBtn.addEventListener('click', async () => {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google'
  });

  if (error) {
    console.error("❌ Error al iniciar sesión con Google:", error.message);
    errorMessage.textContent = error.message;
  } else {
    console.log("✅ Inicio de sesión con Google exitoso", data);
  }
});

// 7. Evento: Cierre de sesión
logoutBtn.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('❌ Error al cerrar sesión:', error.message);
  } else {
    console.log("✅ Sesión cerrada correctamente");
    showLogin();
  }
});

// 8. Eventos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  handleOAuthRedirect();
  checkSession();
});
