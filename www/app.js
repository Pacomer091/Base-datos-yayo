// --- Configuración y Estado ---
let userPin = "";
const CORRECT_PIN = "5456";
let passwords = [];
let isNative = false;

// --- Detección de Plataforma (Capacitor) ---
document.addEventListener('DOMContentLoaded', () => {
    // Si estamos en un móvil como APK, Capacitor estará definido
    if (window.hasOwnProperty('Capacitor')) {
        isNative = true;
        document.body.classList.add('is-native');
        document.getElementById('download-section').style.display = 'none';
        console.log("Modo APK activado: Interfaz móvil premium.");
    } else {
        console.log("Modo Web activado: Landing page.");
    }
    clearPin();
});

// --- Lógica del PIN ---
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
        alert("Incorrecto, Miguel. Prueba otra vez.");
        clearPin();
    }
}

// --- Navegación ---
function showList() {
    hideAllScreens();
    screenList.style.display = 'block';
    if (isNative) {
        document.getElementById('bottom-nav').style.display = 'flex';
        updateNav('list');
    }
    loadFromLocal();
}

function showAddForm() {
    hideAllScreens();
    screenAdd.style.display = 'block';
    if (isNative) {
        document.getElementById('bottom-nav').style.display = 'flex';
        updateNav('add');
    }
}

function hideAllScreens() {
    screenPin.style.display = 'none';
    screenList.style.display = 'none';
    screenAdd.style.display = 'none';
}

function updateNav(page) {
    const items = document.querySelectorAll('.nav-item');
    items.forEach(i => i.classList.remove('active'));
    if (page === 'list') items[0].classList.add('active');
    if (page === 'add') items[1].classList.add('active');
}

// --- Lógica de Seguridad (Encriptación) ---
function encrypt(text) {
    return CryptoJS.AES.encrypt(text, CORRECT_PIN).toString(); // Usamos el PIN fijo para que sea recuperable
}

function decrypt(cipher) {
    try {
        const bytes = CryptoJS.AES.decrypt(cipher, CORRECT_PIN);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return "Error al leer";
    }
}

// --- Gestión Local (APK Friendly) ---
function loadFromLocal() {
    const raw = localStorage.getItem('miguel_vault');
    if (raw) {
        const encryptedData = JSON.parse(raw);
        passwords = encryptedData.map(item => ({
            site: item.site,
            user: item.user,
            pass: decrypt(item.pass)
        }));
    } else {
        passwords = [];
    }
    renderPasswords();
}

function saveToLocal() {
    const encryptedData = passwords.map(item => ({
        site: item.site,
        user: item.user,
        pass: encrypt(item.pass)
    }));
    localStorage.setItem('miguel_vault', JSON.stringify(encryptedData));
}

function renderPasswords() {
    if (passwords.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; margin-top: 2rem; opacity: 0.6;">No tienes claves guardadas aún.</p>';
        return;
    }

    listContainer.innerHTML = passwords.map((pass, index) => `
        <div class="card">
            <div class="card-title">${pass.site}</div>
            <p><strong>Usuario:</strong> ${pass.user}</p>
            <p style="margin-bottom: 1rem;"><strong>Clave:</strong> ${pass.pass}</p>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-outline" style="flex: 2;" onclick="copyToClipboard('${pass.pass}')">COPIAR</button>
                <button class="btn btn-outline" style="flex: 1; border-color: #ef4444; color: #ef4444;" onclick="deletePassword(${index})">ELIMINAR</button>
            </div>
        </div>
    `).join('');
}

function deletePassword(index) {
    if (confirm("¿Seguro que quieres borrar esta clave?")) {
        passwords.splice(index, 1);
        saveToLocal();
        renderPasswords();
    }
}

function savePassword() {
    const site = document.getElementById('in-site').value;
    const user = document.getElementById('in-user').value;
    const pass = document.getElementById('in-pass').value;

    if (!site || !pass) {
        alert("Necesitas poner el nombre y la clave.");
        return;
    }

    passwords.push({ site, user, pass });
    saveToLocal();
    
    alert("¡Guardado correctamente!");
    showList();
    
    // Limpiar
    document.getElementById('in-site').value = "";
    document.getElementById('in-user').value = "";
    document.getElementById('in-pass').value = "";
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("¡Copiado!");
    });
}

// --- Funciones de Archivo (Copia de Seguridad) ---
function exportToFile() {
    const data = localStorage.getItem('miguel_vault');
    if (!data) return alert("No hay nada que exportar.");
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Copia_Seguridad_Miguel_${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("Copia descargada. Guárdala bien.");
}

function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            JSON.parse(content); // Validar JSON
            localStorage.setItem('miguel_vault', content);
            alert("¡Datos importados con éxito!");
            loadFromLocal();
        } catch (err) {
            alert("El archivo no es válido.");
        }
    };
    reader.readAsText(file);
}

// Inicializar
clearPin();
