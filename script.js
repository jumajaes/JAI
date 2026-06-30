// --- SELECCIÓN DE ELEMENTOS ---
const endpointInput = document.getElementById('endpoint');
const maxTokensInput = document.getElementById('max-tokens');
const tokenVal = document.getElementById('token-val');
const tempInput = document.getElementById('temperature');
const tempVal = document.getElementById('temp-val');

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loader = document.getElementById('loader');

// --- ACTUALIZACIÓN DINÁMICA DE TEXTOS EN PANEL ---
maxTokensInput.addEventListener('input', (e) => tokenVal.textContent = e.target.value);
tempInput.addEventListener('input', (e) => tempVal.textContent = e.target.value);

// --- CONTROL DE ESTADOS (CARGANDO / LISTO) ---
function setDocLoading(isLoading) {
    if (isLoading) {
        userInput.disabled = true;
        sendBtn.disabled = true;
        loader.classList.remove('hidden'); // Muestra la 'J' negra brillante
    } else {
        userInput.disabled = false;
        sendBtn.disabled = false;
        loader.classList.add('hidden'); // Oculta la 'J'
        userInput.focus();
    }
}

// --- AGREGAR BURBUJAS DE TEXTO AL DOM ---
function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'user' ? 'user-msg' : 'assistant-msg');
    
    // Formatear sutilmente bloques de código si la IA responde con ```
    let formattedText = text;
    if (formattedText.includes('```')) {
        const parts = formattedText.split('```');
        for (let i = 1; i < parts.length; i += 2) {
            parts[i] = `<pre><code>${parts[i].replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
        }
        formattedText = parts.join('');
    }

    msgDiv.innerHTML = `
        <div class="avatar">${sender === 'user' ? 'TÚ' : 'AI'}</div>
        <div class="text">${formattedText}</div>
    `;
    
    chatMessages.appendChild(msgDiv);
    // Auto Scroll hacia abajo
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- FUNCIÓN PRINCIPAL DE TRANSMISIÓN ---
async function sendMessage() {
    const prompt = userInput.value.trim();
    if (!prompt) return;

    // Pintar mensaje del usuario en pantalla y limpiar input
    appendMessage('user', prompt);
    userInput.value = '';

    // Bloquear controles y encender la 'J' negra de carga
    setDocLoading(true);

    // Preparar el Body dinámico basado en lo elegido en los campos
    const targetUrl = endpointInput.value;
    const requestPayload = {
        messages: [{ role: "user", content: prompt }],
        max_tokens: parseInt(maxTokensInput.value),
        temperature: parseFloat(tempInput.value)
    };

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        // Extraer la respuesta del formato nativo OpenAI que escupe Llama.cpp
        const aiResponse = data.choices[0].message.content;
        
        appendMessage('assistant', aiResponse);

    } catch (error) {
        console.error(error);
        appendMessage('assistant', `❌ Error de conexión con la IA.\nVerifica si el servidor sigue corriendo en ${targetUrl}\nDetalle: ${error.message}`);
    } finally {
        // Liberar controles y apagar cargador
        setDocLoading(false);
    }
}

// --- EVENTOS DE DISPARO ---
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    // Enviar con Enter clásico, saltar línea con Shift + Enter
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
