// 1. ESTADO GLOBAL
let lineaSeleccionada = null;
let bloqueSeleccionado = null;
let operacionSeleccionada = null;

const colaboradores = [
    { nombre: "BALTAZAR", habilidades: ["ENGINE"] },
    { nombre: "SANTOS", habilidades: ["ENGINE"] },
    { nombre: "KAREN PADILLA", habilidades: ["FR END", "DOOR LH", "DOOR RH"] },
    { nombre: "GIOVANNI LOPEZ", habilidades: ["ENGINE", "RR END", "DOOR LH", "DOOR RH"] },
    { nombre: "EMANUEL", habilidades: ["ENGINE", "RR END", "DOOR RH"] },
    { nombre: "SANDRA LARA", habilidades: ["FR END", "RR END", "DOOR LH", "DOOR RH"] },
    { nombre: "QUETZALY", habilidades: ["FR END", "DOOR LH", "DOOR RH"] },
    { nombre: "KAREN HDZ", habilidades: ["ENGINE", "FR END", "DOOR LH", "DOOR RH"] },
    { nombre: "CRISTINA", habilidades: ["ENGINE", "FR END", "DOOR LH", "DOOR RH"] },
    { nombre: "DANIEL", habilidades: ["RR END", "DOOR LH", "DOOR RH"] },
    { nombre: "PAULA", habilidades: ["FR END"] },
    { nombre: "JESUS", habilidades: ["RR END"] },
];

const HORARIOS = ["8:30pm - 11:00", "11:05pm - 1:30", "2:05am - 4:35", "4:45am - 7:00"];
const CATEGORIAS_EXTRA = ["VACACIONES", "FALTAS", "INCAPACIDADES"];

let rolDelDia = JSON.parse(localStorage.getItem('rolOperativo')) || {
    "PL1": {}, "PL2": {}, "VACACIONES": {}, "FALTAS": {}, "INCAPACIDADES": {}
};

// Inicialización de estructura
[...["PL1", "PL2"], ...CATEGORIAS_EXTRA].forEach(cat => {
    if (!rolDelDia[cat]) rolDelDia[cat] = {};
    HORARIOS.forEach(h => { if (!rolDelDia[cat][h]) rolDelDia[cat][h] = {}; });
});

// --- FUNCIONES DE RESALTADO (LÓGICA MEJORADA) ---

function resaltarCompatibles(nombre) {
    limpiarResaltados();
    const empleado = colaboradores.find(c => c.nombre === nombre);
    if (!empleado) return;

    document.querySelectorAll('.op-cell').forEach(celda => {
        if (empleado.habilidades.includes(celda.innerText.trim())) {
            celda.classList.add('highlight-op');
        }
    });
}

function alternarCaptura() {
    // 1. Cambiamos la clase en el body
    document.body.classList.toggle('modo-captura');
    
    const btn = document.getElementById('btnCaptura');
    const estaEnCaptura = document.body.classList.contains('modo-captura');
    
    // 2. Actualizamos el texto del botón
    btn.innerText = estaEnCaptura ? "Volver a Normal" : "Modo Captura";
    
    // 3. Si entramos en modo captura, cerramos el panel de nombres por si estaba abierto
    if (estaEnCaptura) {
        cerrarPanel();
    }
}

function resaltarColaboradoresHabilitados(operacion) {
    limpiarResaltados();
    const botones = document.querySelectorAll('.btn-nombre');
    botones.forEach(btn => {
        const nombreLimpio = btn.innerText.split('(')[0].trim();
        const empleado = colaboradores.find(c => c.nombre === nombreLimpio);
        if (empleado && empleado.habilidades.includes(operacion)) {
            btn.classList.add('btn-highlight');
        }
    });
}

function limpiarResaltados() {
    document.querySelectorAll('.op-cell').forEach(c => c.classList.remove('highlight-op'));
    document.querySelectorAll('.btn-nombre').forEach(b => b.classList.remove('btn-highlight'));
}

function asignarManual() {
    const input = document.getElementById('nombreManual');
    const nombre = input.value.trim().toUpperCase();

    if (!lineaSeleccionada) {
        alert("⚠️ Selecciona primero una celda en la tabla.");
        return;
    }
    if (!nombre) {
        alert("⚠️ Escribe un nombre antes de asignar.");
        return;
    }

    asignarNombre(nombre);
    input.value = ""; // Limpiar el cuadro de texto
}

// --- LÓGICA DE CONTROL ---

function seleccionarCelda(linea, bloque, operacion) {
    lineaSeleccionada = linea;
    bloqueSeleccionado = bloque;
    operacionSeleccionada = operacion;

    const actual = rolDelDia[linea][bloque][operacion];
    if (actual) {
        if (confirm(`¿Quitar a ${actual} de esta posición?`)) {
            rolDelDia[linea][bloque][operacion] = "";
            localStorage.setItem('rolOperativo', JSON.stringify(rolDelDia));
        }
    }
    
    renderizarTabla();
    renderizarBotonesColaboradores();
    
    // Al seleccionar, resaltamos automáticamente quiénes pueden entrar ahí
    resaltarColaboradoresHabilitados(operacion);
}

function cerrarPanel() {
    lineaSeleccionada = null;
    bloqueSeleccionado = null;
    operacionSeleccionada = null;
    limpiarResaltados();
    document.getElementById('panel-nombres').classList.add('hidden');
    renderizarTabla();
}

function asignarNombre(nombre) {
    const empleado = colaboradores.find(c => c.nombre === nombre);

    if (lineaSeleccionada.startsWith("PL")) {
        if (!empleado.habilidades.includes(operacionSeleccionada)) {
            alert(`❌ ${nombre} no tiene capacitación para ${operacionSeleccionada}`);
            return;
        }
    }

    let ocupadoEn = validarDisponibilidad(nombre);
    if (ocupadoEn) {
        alert(`⚠️ ${nombre} ya está ocupado en ${ocupadoEn}.`);
        return;
    }

    rolDelDia[lineaSeleccionada][bloqueSeleccionado][operacionSeleccionada] = nombre;
    localStorage.setItem('rolOperativo', JSON.stringify(rolDelDia));
    renderizarTabla();
    renderizarBotonesColaboradores();
    // Mantener resaltado tras asignar
    resaltarColaboradoresHabilitados(operacionSeleccionada);
}

function validarDisponibilidad(nombre) {
    let ocupadoEn = null;
    [...["PL1", "PL2"], ...CATEGORIAS_EXTRA].forEach(cat => {
        if (Object.values(rolDelDia[cat][bloqueSeleccionado]).includes(nombre)) {
            ocupadoEn = cat;
        }
    });
    return ocupadoEn;
}

// --- RENDERIZADO ---

function renderizarTabla() {
    const opsProduccion = ["ENGINE", "FR END", "RR END", "DOOR LH", "DOOR RH"];
    ["PL1", "PL2"].forEach(linea => dibujarFilas(linea, opsProduccion));

    const filasEstado = ["LINEA 1", "LINEA 2", "LINEA 3"];
    CATEGORIAS_EXTRA.forEach(cat => dibujarFilas(cat, filasEstado));
}

function dibujarFilas(idTabla, listaFilas) {
    const cuerpo = document.getElementById(`cuerpo-${idTabla}`);
    if (!cuerpo) return;
    
    let html = "";
    listaFilas.forEach(fila => {
        html += `<tr>
            <td class="op-cell" 
                onmouseover="resaltarColaboradoresHabilitados('${fila}')" 
                onmouseout="if(!operacionSeleccionada) limpiarResaltados()">
                ${fila}
            </td>`;
        
        HORARIOS.forEach(bloque => {
            const asignado = rolDelDia[idTabla][bloque][fila] || "";
            const estaSel = lineaSeleccionada === idTabla && bloqueSeleccionado === bloque && operacionSeleccionada === fila;
            
            html += `<td onclick="seleccionarCelda('${idTabla}', '${bloque}', '${fila}')" 
                        class="${estaSel ? 'selected' : ''}">
                        ${asignado}
                     </td>`;
        });
        html += `</tr>`;
    });
    cuerpo.innerHTML = html;
}

function renderizarBotonesColaboradores() {
    const contenedor = document.getElementById('panel-nombres');
    if (!bloqueSeleccionado) {
        contenedor.classList.add('hidden');
        return;
    }
    
    contenedor.classList.remove('hidden');
    
    let html = `
        <button class="btn-cerrar" onclick="cerrarPanel()">Cerrar</button>
        <h3>Asignar a: ${operacionSeleccionada} (${bloqueSeleccionado})</h3>
        <div class="grid-nombres">`;

    colaboradores.forEach(c => {
        let ocupadoGlobal = false;
        [...["PL1", "PL2"], ...CATEGORIAS_EXTRA].forEach(cat => {
            if (Object.values(rolDelDia[cat][bloqueSeleccionado]).includes(c.nombre)) {
                ocupadoGlobal = true;
            }
        });

        html += `<button 
                    onclick="asignarNombre('${c.nombre}')" 
                    onmouseover="resaltarCompatibles('${c.nombre}')"
                    onmouseout="resaltarColaboradoresHabilitados(operacionSeleccionada)"
                    ${ocupadoGlobal ? 'disabled' : ''} 
                    class="btn-nombre">
                    ${c.nombre} ${ocupadoGlobal ? '(Ocupado)' : ''}
                 </button>`;
    });
    contenedor.innerHTML = html + "</div>";
}

function clearRol() {
    if (confirm("¿Vaciar todo el rol?")) {
        localStorage.removeItem('rolOperativo');
        location.reload();
    }
}

window.onload = renderizarTabla;