// 1. ESTADO GLOBAL
let lineaSeleccionada = null;
let bloqueSeleccionado = null;
let operacionSeleccionada = null;

const colaboradores = [
    { nombre: "BALTAZAR", habilidades: ["ENGINE"] },
    { nombre: "KAREN PADILLA", habilidades: ["FR END", "DOOR LH", "DOOR RH"] },
    { nombre: "GIOVANNI LOPEZ", habilidades: ["ENGINE", "RR END", "DOOR LH", "DOOR RH"] },
    { nombre: "EMANUEL", habilidades: ["ENGINE", "RR END"] },
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

// Estructura inicial extendida
let rolDelDia = JSON.parse(localStorage.getItem('rolOperativo')) || {
    "PL1": {}, "PL2": {}, "VACACIONES": {}, "FALTAS": {}, "INCAPACIDADES": {}
};

// Asegurar que todas las categorías y horarios existan al cargar
[...["PL1", "PL2"], ...CATEGORIAS_EXTRA].forEach(cat => {
    if (!rolDelDia[cat]) rolDelDia[cat] = {};
    HORARIOS.forEach(h => { if (!rolDelDia[cat][h]) rolDelDia[cat][h] = {}; });
});

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
}

// Función para validar ocupación global (Reutilizable)
function validarDisponibilidad(nombre) {
    let ocupadoEn = null;
    [...["PL1", "PL2"], ...CATEGORIAS_EXTRA].forEach(cat => {
        if (Object.values(rolDelDia[cat][bloqueSeleccionado]).includes(nombre)) {
            ocupadoEn = cat;
        }
    });
    return ocupadoEn;
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
        alert(`⚠️ ${nombre} ya está ocupado en ${ocupadoEn} en este horario.`);
        return;
    }

    rolDelDia[lineaSeleccionada][bloqueSeleccionado][operacionSeleccionada] = nombre;
    localStorage.setItem('rolOperativo', JSON.stringify(rolDelDia));
    renderizarTabla();
    renderizarBotonesColaboradores();
}

// MEJORA: Función para asignar personal ajeno manualmente
function asignarManual() {
    const nombre = document.getElementById('nombreManual').value.trim().toUpperCase();
    if (!nombre) { alert("Escribe un nombre primero"); return; }
    if (!lineaSeleccionada) { alert("Selecciona una celda primero"); return; }

    let ocupadoEn = validarDisponibilidad(nombre);
    if (ocupadoEn) {
        alert(`⚠️ ${nombre} ya está asignado en ${ocupadoEn}. No se puede duplicar.`);
        return;
    }

    rolDelDia[lineaSeleccionada][bloqueSeleccionado][operacionSeleccionada] = nombre;
    localStorage.setItem('rolOperativo', JSON.stringify(rolDelDia));
    document.getElementById('nombreManual').value = ""; // Limpiar campo
    renderizarTabla();
    renderizarBotonesColaboradores();
}

function renderizarTabla() {
    const opsProduccion = ["ENGINE", "FR END", "RR END", "DOOR LH", "DOOR RH"];
    ["PL1", "PL2"].forEach(linea => {
        dibujarFilas(linea, opsProduccion);
    });

    // MEJORA: Ahora 3 filas para estados
    const filasEstado = ["LINEA 1", "LINEA 2", "LINEA 3"];
    CATEGORIAS_EXTRA.forEach(cat => {
        dibujarFilas(cat, filasEstado);
    });
}

function dibujarFilas(idTabla, listaFilas) {
    const cuerpo = document.getElementById(`cuerpo-${idTabla}`);
    if (!cuerpo) return;
    
    let html = "";
    listaFilas.forEach(fila => {
        html += `<tr><td class="op-cell">${fila}</td>`;
        HORARIOS.forEach(bloque => {
            const asignado = rolDelDia[idTabla][bloque][fila] || "";
            const esRepetido = asignado && HORARIOS.some(b => b !== bloque && rolDelDia[idTabla][b][fila] === asignado);
            const estaSel = lineaSeleccionada === idTabla && bloqueSeleccionado === bloque && operacionSeleccionada === fila;
            
            html += `<td onclick="seleccionarCelda('${idTabla}', '${bloque}', '${fila}')" 
                        class="${esRepetido ? 'warning' : ''} ${estaSel ? 'selected' : ''}">
                        ${asignado}
                     </td>`;
        });
        html += `</tr>`;
    });
    cuerpo.innerHTML = html;
}

function renderizarBotonesColaboradores() {
    const contenedor = document.getElementById('panel-nombres');
    if (!bloqueSeleccionado) return;
    
    let html = `<h3>${lineaSeleccionada} - ${operacionSeleccionada}</h3><div class="grid-nombres">`;
    colaboradores.forEach(c => {
        let ocupadoGlobal = false;
        [...["PL1", "PL2"], ...CATEGORIAS_EXTRA].forEach(cat => {
            if (Object.values(rolDelDia[cat][bloqueSeleccionado]).includes(c.nombre)) {
                ocupadoGlobal = true;
            }
        });

        html += `<button onclick="asignarNombre('${c.nombre}')" 
                 ${ocupadoGlobal ? 'disabled' : ''} 
                 class="btn-nombre">
                 ${c.nombre} ${ocupadoGlobal ? '(Ocupado)' : ''}
                 </button>`;
    });
    contenedor.innerHTML = html + "</div>";
}

function clearRol() {
    if (confirm("¿Vaciar todo el rol y estados de personal?")) {
        localStorage.removeItem('rolOperativo');
        location.reload();
    }
}

function alternarCaptura() {
    document.body.classList.toggle('modo-captura');
    const btn = document.getElementById('btnCaptura');
    btn.innerText = document.body.classList.contains('modo-captura') ? "Volver a Normal" : "Modo Captura";
    
    if (document.body.classList.contains('modo-captura')) {
        // Salir del modo al tocar cualquier lado para comodidad del líder
        window.onclick = function(e) {
            if(e.target.id !== 'btnCaptura') {
                document.body.classList.remove('modo-captura');
                btn.innerText = "Modo Captura";
                window.onclick = null;
            }
        };
    }
}

window.onload = renderizarTabla;