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

    // Si la celda ya tiene alguien, preguntar para borrar
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

function asignarNombre(nombre) {
    const empleado = colaboradores.find(c => c.nombre === nombre);

    // 1. Validación de Capacitación (Solo aplica si la celda es de producción PL1 o PL2)
    if (lineaSeleccionada.startsWith("PL")) {
        if (!empleado.habilidades.includes(operacionSeleccionada)) {
            alert(`❌ ${nombre} no tiene capacitación para ${operacionSeleccionada}`);
            return;
        }
    }

    // 2. Validación de Unicidad Global (¿Está en CUALQUIER otra tabla en este bloque?)
    let ocupadoEn = null;
    [...["PL1", "PL2"], ...CATEGORIAS_EXTRA].forEach(cat => {
        if (Object.values(rolDelDia[cat][bloqueSeleccionado]).includes(nombre)) {
            ocupadoEn = cat;
        }
    });

    if (ocupadoEn) {
        alert(`⚠️ ${nombre} ya está ocupado en ${ocupadoEn} en este horario.`);
        return;
    }

    rolDelDia[lineaSeleccionada][bloqueSeleccionado][operacionSeleccionada] = nombre;
    localStorage.setItem('rolOperativo', JSON.stringify(rolDelDia));
    renderizarTabla();
    renderizarBotonesColaboradores();
}

function renderizarTabla() {
    // Renderizar Líneas de Producción
    const opsProduccion = ["ENGINE", "FR END", "RR END", "DOOR LH", "DOOR RH"];
    ["PL1", "PL2"].forEach(linea => {
        dibujarFilas(linea, opsProduccion);
    });

    // Renderizar Tablas de Estado (2 filas cada una)
    const filasEstado = ["LINEA 1", "LINEA 2"];
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
            // Warning si repite en la misma tabla/línea
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
        // Verificar ocupación global para deshabilitar botones
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
}

window.onload = renderizarTabla;