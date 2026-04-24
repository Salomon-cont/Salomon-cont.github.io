// Mapeo de clases proporcionado por el usuario
const CLASS_MAP = {
    "0": "guantes",
    "1": "lentes",
    "2": "casco",
    "3": "persona",
    "4": "botas",
    "5": "chaleco"
};

// EPPs obligatorios a verificar (excluimos 'persona')
const REQUIRED_EPP = ["guantes", "lentes", "casco", "botas", "chaleco"];

// DOM Elements
const setupPanel = document.getElementById('setupPanel');
const visionPanel = document.getElementById('visionPanel');
const dashboardPanel = document.getElementById('dashboardPanel');
const apiKeyInput = document.getElementById('apiKey');
const projectIdInput = document.getElementById('projectId');
const modelVersionInput = document.getElementById('modelVersion');
const startBtn = document.getElementById('startBtn');
const setupError = document.getElementById('setupError');
const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const ctx = canvasElement.getContext('2d');
const loadingModel = document.getElementById('loadingModel');
const systemStatusDot = document.getElementById('systemStatusDot');
const systemStatusText = document.getElementById('systemStatusText');
const globalAlert = document.getElementById('globalAlert');

let isRunning = false;
let userApiKey = "";
let userModelEndpoint = "";

// Estado de detecciones (para mantener el estado verde por unos frames/segundos)
const detectionState = {
    "guantes": 0,
    "lentes": 0,
    "casco": 0,
    "botas": 0,
    "chaleco": 0
};
// Cuantos ciclos mantener el estado de detectado después de no verlo
const DETECTION_TIMEOUT = 5; 

// Inicialización de la cámara
async function setupWebcam() {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 },
            audio: false,
        }).then(stream => {
            webcamElement.srcObject = stream;
            webcamElement.addEventListener('loadeddata', () => {
                canvasElement.width = webcamElement.videoWidth;
                canvasElement.height = webcamElement.videoHeight;
                resolve();
            }, false);
        }).catch(err => {
            reject(err);
        });
    });
}

// Enviar frame a Roboflow Hosted API
async function detectFrame() {
    if (!isRunning) return;

    try {
        // 1. Extraer imagen de la cámara como Base64
        // Usamos un canvas temporal para obtener el frame en formato base64
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = webcamElement.videoWidth;
        tempCanvas.height = webcamElement.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(webcamElement, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Convertir a base64 (solo la data despues de la coma)
        const base64Image = tempCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        // 2. Enviar a Roboflow Cloud
        const response = await fetch(`${userModelEndpoint}?api_key=${userApiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: base64Image
        });

        if (!response.ok) {
            console.error("Error en API:", await response.text());
            throw new Error("HTTP error " + response.status);
        }

        const data = await response.json();
        
        // 3. Dibujar resultados
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Disminuir contadores de detección (Fade out effect)
        for (let key in detectionState) {
            if (detectionState[key] > 0) {
                detectionState[key]--;
            }
        }

        if (data.predictions) {
            data.predictions.forEach(pred => {
                // pred.class suele venir como string ("0", "1")
                const className = CLASS_MAP[pred.class] || pred.class.toLowerCase();
                
                // Actualizar estado si es un EPP
                if (REQUIRED_EPP.includes(className)) {
                    detectionState[className] = DETECTION_TIMEOUT;
                }

                // El elemento video tiene transform: scaleX(-1) en CSS (espejo)
                // Invertimos la coordenada X
                const x = canvasElement.width - (pred.x + pred.width / 2);
                const y = pred.y - pred.height / 2;
                const width = pred.width;
                const height = pred.height;

                // Dibujar rectángulo
                ctx.beginPath();
                ctx.lineWidth = 3;
                let color = '#10b981'; 
                if (className === 'persona') color = '#3b82f6';
                
                ctx.strokeStyle = color;
                ctx.rect(x, y, width, height);
                ctx.stroke();

                // Fondo para el texto
                ctx.fillStyle = color;
                ctx.fillRect(x, y - 24, width, 24);

                // Texto de clase
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Inter';
                ctx.fontWeight = 'bold';
                ctx.fillText(`${className} ${Math.round(pred.confidence * 100)}%`, x + 4, y - 6);
            });
        }

        updateDashboard();

    } catch (e) {
        console.error("Error en inferencia: ", e);
    }

    // Esperar un poco antes de pedir el siguiente frame para no saturar la API
    // (Ej. 3-4 frames por segundo)
    setTimeout(() => {
        if(isRunning) requestAnimationFrame(detectFrame);
    }, 300);
}

// Actualizar UI del Panel de EPPs
function updateDashboard() {
    let missingCount = 0;

    REQUIRED_EPP.forEach(epp => {
        const itemElement = document.querySelector(`.epp-item[data-epp-id="${epp}"]`);
        const statusText = itemElement.querySelector('.epp-status-text');

        if (detectionState[epp] > 0) {
            itemElement.classList.remove('missing');
            itemElement.classList.add('detected');
            statusText.textContent = 'Detectado';
        } else {
            itemElement.classList.remove('detected');
            itemElement.classList.add('missing');
            statusText.textContent = 'Faltante';
            missingCount++;
        }
    });

    // Actualizar Alerta Global
    if (missingCount === 0) {
        globalAlert.classList.remove('alert-danger');
        globalAlert.classList.add('alert-success');
        globalAlert.innerHTML = '✅ EQUIPO COMPLETO: Acceso Permitido';
    } else {
        globalAlert.classList.remove('alert-success');
        globalAlert.classList.add('alert-danger');
        globalAlert.innerHTML = `⚠️ ALERTA: Faltan ${missingCount} EPP(s) obligatorio(s)`;
    }
}

// Botón de Inicio
startBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const projectId = projectIdInput.value.trim();
    const version = modelVersionInput.value.trim();

    if (!apiKey) {
        setupError.textContent = "Por favor ingresa tu API Key.";
        return;
    }

    setupError.textContent = "";
    startBtn.disabled = true;
    startBtn.textContent = "Iniciando...";

    try {
        // 1. Mostrar paneles principales y activar loader
        setupPanel.classList.add('hidden');
        visionPanel.classList.remove('hidden');
        dashboardPanel.classList.remove('hidden');
        loadingModel.classList.add('active');

        // 2. Iniciar cámara
        await setupWebcam();

        // 3. Configurar endpoint basado en el código que mostraste
        userApiKey = apiKey;
        userModelEndpoint = `https://detect.roboflow.com/${projectId}/${version}`;
        
        // 4. Ocultar loader y empezar inferencia
        loadingModel.classList.remove('active');
        systemStatusDot.classList.add('active');
        systemStatusText.textContent = "Sistema Activo - Cloud API";
        
        isRunning = true;
        detectFrame();

    } catch (error) {
        console.error(error);
        startBtn.disabled = false;
        startBtn.textContent = "Iniciar Sistema";
        setupPanel.classList.remove('hidden');
        visionPanel.classList.add('hidden');
        dashboardPanel.classList.add('hidden');
        loadingModel.classList.remove('active');
        
        setupError.textContent = "Error al acceder a la cámara o iniciar el modelo.";
    }
});
