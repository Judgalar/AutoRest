// Obtener referencias a los formularios y elementos de mensajes
const registroForm = document.getElementById('registroForm');
const loginForm = document.getElementById('loginForm');
const tokenForm = document.getElementById('tokenForm');
const mensajeRegistro = document.getElementById('mensajeRegistro');
const mensajeLogin = document.getElementById('mensajeLogin');
const mensajeToken = document.getElementById('mensajeToken');

// Manejador de evento para el registro
registroForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('nameRegistro').value;
    const password = document.getElementById('passwordRegistro').value;

    try {
        const response = await fetch('http://localhost:3000/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password })
        });

        if (response.ok) {
            mensajeRegistro.textContent = 'Usuario registrado correctamente';
        } else {
            mensajeRegistro.textContent = 'Error al registrar el usuario';
        }
    } catch (error) {
        mensajeRegistro.textContent = 'Error al registrar el usuario';
    }
});

// Manejador de evento para el inicio de sesión
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('nameLogin').value;
    const password = document.getElementById('passwordLogin').value;

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password })
        });

        if (response.ok) {
            const data = await response.json();
            mensajeLogin.textContent = 'Tokens: ' + JSON.stringify(data.tokens);
        } else {
            mensajeLogin.textContent = 'Error al iniciar sesión';
        }
    } catch (error) {
        mensajeLogin.textContent = 'Error al iniciar sesión';
    }
});

// Manejador de evento para generar un token
tokenForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('nameToken').value;
    const password = document.getElementById('passwordToken').value;

    try {
        const response = await fetch('http://localhost:3000/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password })
        });

        if (response.ok) {
            const data = await response.json();
            mensajeToken.textContent = 'Token generado: ' + data.token;
        } else {
            mensajeToken.textContent = 'Error al generar el token';
        }
    } catch (error) {
        mensajeToken.textContent = 'Error al generar el token';
    }
});
