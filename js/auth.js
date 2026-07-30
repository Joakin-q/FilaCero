document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener valores
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Aquí llamarás a tu función de conexión a la base de datos (Firebase/SQL)
    const usuario = await autenticarUsuario(email, password);

    if (usuario) {
        // Redirección según rol obtenido de la base de datos
        if (usuario.rol === 'administrador') {
            window.location.href = '../admin/dashboard.html';
        } else {
            window.location.href = '../paciente/inicio.html';
        }
    } else {
        alert("Credenciales incorrectas");
    }
});

async function autenticarUsuario(email, password) {
    // Simulación: aquí pondrás tu código de verificación real
    return { rol: 'paciente' }; 
}