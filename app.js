// --- Configuración y Estado ---
let userPin = "";
const CORRECT_PIN = "5456"; // Actualizado según pedido
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQSuiQXnxVXLyNSAOLc6Bf9-BDrswU9TSFX3aEcOF78WwEtQhkecskYlgZAFefcCN3/exec'; 

let passwords = [];

// --- Elementos de la Interfaz ---
const screenPin = document.getElementById('screen-pin');
const screenList = document.getElementById('screen-list');
const screenAdd = document.getElementById('screen-add');
const pinDots = document.querySelectorAll('.pin-dot');
const listContainer = document.getElementById('password-list');

// --- Lógica del PIN ---
function addPin(digit) {
    if (userPin.length < 4) {
        userPin += digit;
        updatePinDots();
        
        if (userPin.length === 4) {
            setTimeout(validatePin, 200);
        }
    }
}

function clearPin() {
    userPin = "";
    updatePinDots();
}

function updatePinDots() {
    pinDots.forEach((dot, index) => {
        if (index < userPin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

async function validatePin() {
    if (userPin === CORRECT_PIN) {
        showList();
    } else {
        alert("Ese código no es correcto, Miguel. Prueba otra vez.");
        clearPin();
    }
}

// --- Navegación ---
async function showList() {
    hideAllScreens();
    screenList.style.display = 'block';
    await fetchPasswords();
}

function showAddForm() {
    hideAllScreens();
    screenAdd.style.display = 'block';
}

function hideAllScreens() {
    screenPin.style.display = 'none';
    screenList.style.display = 'none';
    screenAdd.style.display = 'none';
}

// --- Lógica de Seguridad (Encriptación) ---
function encrypt(text) {
    return CryptoJS.AES.encrypt(text, userPin).toString();
}

function decrypt(cipher) {
    try {
        const bytes = CryptoJS.AES.decrypt(cipher, userPin);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return "Error al leer";
    }
}

// --- Gestión de Contraseñas (Google Sheets) ---
async function fetchPasswords() {
    listContainer.innerHTML = '<p style="text-align: center; margin-top: 2rem;">Buscando tus claves...</p>';
    try {
        const response = await fetch(SCRIPT_URL + "?action=get");
        const data = await response.json();
        
        // Desencriptar cada contraseña antes de mostrarla
        passwords = data.map(item => ({
            site: item.site,
            user: item.user,
            pass: decrypt(item.pass)
        }));
        
        renderPasswords();
    } catch (e) {
        console.error(e);
        listContainer.innerHTML = '<p style="text-align: center; color: red;">Error al conectar. Revisa la URL del script.</p>';
    }
}

function renderPasswords() {
    if (passwords.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; margin-top: 2rem;">No tienes ninguna guardada todavía.</p>';
        return;
    }

    listContainer.innerHTML = passwords.map(pass => `
        <div class="card">
            <div class="card-title">${pass.site}</div>
            <p><strong>Usuario:</strong> ${pass.user}</p>
            <p style="margin-bottom: 1rem;"><strong>Clave:</strong> ${pass.pass}</p>
            <button class="btn btn-outline" onclick="copyToClipboard('${pass.pass}')">COPIAR CLAVE</button>
        </div>
    `).join('');
}

async function savePassword() {
    const site = document.getElementById('in-site').value;
    const user = document.getElementById('in-user').value;
    const pass = document.getElementById('in-pass').value;

    if (!site || !pass) {
        alert("Falta el nombre de la web o la contraseña.");
        return;
    }

    const btn = document.querySelector('#screen-add .btn-primary');
    btn.innerText = "GUARDANDO...";
    btn.disabled = true;

    try {
        // Encriptar la contraseña ANTES de enviarla a Google Sheets
        const encryptedPass = encrypt(pass);

        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            body: JSON.stringify({ action: 'add', site, user, pass: encryptedPass })
        });
        
        alert("¡Guardado correctamente, Miguel!");
        showList();
    } catch (e) {
        alert("No se pudo guardar. Revisa la conexión.");
    } finally {
        btn.innerText = "GUARDAR";
        btn.disabled = false;
        // Limpiar campos
        document.getElementById('in-site').value = "";
        document.getElementById('in-user').value = "";
        document.getElementById('in-pass').value = "";
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("¡Copiado! Ya puedes pegarlo.");
    });
}

// Inicializar
clearPin();
