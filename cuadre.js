/* =========================
   FORMATEO Y UTILIDADES
========================= */

// Formatea un número como moneda peruana (PEN)
function formatNumber(num) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
    }).format(num);
}

// Obtiene el valor numérico de un input por ID
// Convierte comas en puntos y retorna 0 si es inválido
function getValue(id) {
    const element = document.getElementById(id);
    if (!element) return 0;

    let value = element.value.toString().replace(',', '.');
    return parseFloat(value) || 0;
}

// Variable para rastrear si estamos editando un cuadre existente
let cuadreEnEdicion = null;


/* =========================
          CALCULOS
========================= */

// Función principal que recalcula todos los totales
function updateCalculations() {

    /* -------- VENTAS -------- */

    const totalVentas = getValue('total-ventas');
    const fueraRuta   = getValue('fuera-ruta');
    const campo3      = getValue('campo-3');
    const campo4      = getValue('campo-4');

    const sumaVentas = totalVentas + fueraRuta + campo3 + campo4;

    const productosNoDespachados = getValue('productos-no-desp');
    const devoluciones           = getValue('devoluciones');
    const dctoMercaderia         = getValue('dcto-mercaderia');

    const subtotalVentas =
        sumaVentas -
        productosNoDespachados -
        devoluciones -
        dctoMercaderia;

    document.getElementById('subtotal-ventas').textContent =
        formatNumber(subtotalVentas);


    /* -------- GASTOS MOVILIDAD -------- */

    const gastoMov1 = getValue('gasto-mov-1');
    const gastoMov2 = getValue('gasto-mov-2');
    const gastoMov3 = getValue('gasto-mov-3');
    const gastoMov4 = getValue('gasto-mov-4');
    const gastoMov5 = getValue('gasto-mov-5');

    const totalGastosMovilidad =
        gastoMov1 + gastoMov2 + gastoMov3 + gastoMov4 + gastoMov5;


    /* -------- GASTOS OTROS -------- */

    const combustible = getValue('combustible');
    const bono        = getValue('bono');
    const parqueo     = getValue('parqueo');
    const pasaje      = getValue('pasaje');
    const bano        = getValue('bano');

    const totalGastosOtros =
        combustible + bono + parqueo + pasaje + bano;


    /* -------- TOTAL GASTOS -------- */

    const totalGastos =
        subtotalVentas - totalGastosMovilidad - totalGastosOtros;

    document.getElementById('total-gastos').textContent =
        formatNumber(totalGastos);


    /* -------- EFECTIVO -------- */

    const billetes = getValue('billetes');
    const b5   = getValue('b5');
    const b2   = getValue('b2');
    const b1   = getValue('b1');
    const b050 = getValue('b050');
    const b020 = getValue('b020');
    const b010 = getValue('b010');

    const subtotalEfectivo =
        billetes + b5 + b2 + b1 + b050 + b020 + b010;

    document.getElementById('subtotal-efectivo').textContent =
        formatNumber(subtotalEfectivo);


    /* -------- DEPOSITOS -------- */

    const bcpYape   = getValue('bcp-yape');
    const interbank = getValue('interbank');
    const bbva      = getValue('bbva');

    const subtotalDeposito = bcpYape + interbank + bbva;

    document.getElementById('subtotal-deposito').textContent =
        formatNumber(subtotalDeposito);


    /* -------- DEUDORES -------- */

    const deudor1 = getValue('deudor1');
    const deudor2 = getValue('deudor2');
    const deudor3 = getValue('deudor3');
    const deudor4 = getValue('deudor4');
    const deudor5 = getValue('deudor5');
    const deudor6 = getValue('deudor6');
    const deudor7 = getValue('deudor7');

    const totalDeudores =
        deudor1 + deudor2 + deudor3 +
        deudor4 + deudor5 + deudor6 + deudor7;


    /* -------- TOTAL FINAL -------- */

    const totalFinal =
        subtotalEfectivo + subtotalDeposito + totalDeudores;

    document.getElementById('total-final').textContent =
        formatNumber(totalFinal);


    /* -------- DIFERENCIA -------- */

    const diferencia = totalFinal - totalGastos;

    const filaResultado = document.getElementById('resultado-row');
    const resultado     = document.getElementById('resultado');

    filaResultado.className = '';

    if (diferencia > 0) {
        resultado.textContent = formatNumber(diferencia);
        filaResultado.classList.add('resultado-ok');
    }
    else if (diferencia < 0) {
        resultado.textContent = formatNumber(diferencia);
        filaResultado.classList.add('resultado-falta');
    }
    else {
        resultado.textContent = formatNumber(0);
        filaResultado.classList.add('resultado-cuadra');
    }
}


/* =========================
          EVENTOS
========================= */

// Asigna eventos input y change a todos los inputs numéricos
function addEventListeners() {
    const inputs = document.querySelectorAll('input[type="number"]');

    inputs.forEach(input => {
        input.addEventListener('input', updateCalculations);
        input.addEventListener('change', updateCalculations);
    });
}


/* =========================
        INICIALIZACION
========================= */

// Inicializa eventos y cálculos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    updateCalculations();
});

// Recalcula después de pegar valores
document.addEventListener('paste', () => {
    setTimeout(updateCalculations, 100);
});


/* =========================
       LIMPIEZA TOTAL
========================= */

// Evento botón limpiar
document.getElementById("btn-limpiar")
    .addEventListener("click", limpiarTodo);

// Limpia todos los campos del formulario
function limpiarTodo() {
    cuadreEnEdicion = null;

    document.querySelectorAll("input")
        .forEach(input => limpiarInput(input));

    document.querySelectorAll("span")
        .forEach(span => {
            if (span.id) span.textContent = formatNumber(0);
        });

    updateCalculations();
}

// Limpia un input según su tipo
function limpiarInput(input) {

    if (input.type === "number") {
        input.value = "";
    }

    if (input.type === "text") {
        if (!input.classList.contains('input-label') &&
            input.value !== "GENERAL") {
            input.value = "";
        }
    }

    if (input.type === "date") {
        input.value = new Date().toISOString().split('T')[0];
    }
}


/* =========================
          HISTORIAL
========================= */

// Evento guardar cuadre
document.getElementById("btn-guardar")
    .addEventListener("click", guardarCuadre);

// Guarda el cuadre en localStorage
function guardarCuadre() {

    const fecha = document.getElementById('fecha').value;
    const responsable =
        document.querySelector('.input-field').value.trim();

    if (!fecha) {
        alert('❌ Por favor selecciona una fecha antes de guardar');
        return;
    }

    if (!responsable) {
        alert('❌ Por favor ingresa el nombre del RESPONSABLE antes de guardar');
        return;
    }

    const totalGastos = parseFloat(
        document.getElementById('total-gastos')
            .textContent.replace(/[^0-9.-]/g, '')
    );

    const totalFinal = parseFloat(
        document.getElementById('total-final')
            .textContent.replace(/[^0-9.-]/g, '')
    );

    if (totalGastos === 0 && totalFinal === 0) {
        alert('❌ No puedes guardar un cuadre vacío. Debes ingresar datos primero.');
        return;
    }

    // Recopilar todos los datos
    const cuadre = {
        fecha: fecha,
        responsable: responsable,
        rutaSede: document.querySelectorAll('.input-field')[1].value,

        totalVentas: getValue('total-ventas'),
        fueraRuta: getValue('fuera-ruta'),
        campo3: getValue('campo-3'),
        campo4: getValue('campo-4'),
        productosNoDespachados: getValue('productos-no-desp'),
        devoluciones: getValue('devoluciones'),
        dctoMercaderia: getValue('dcto-mercaderia'),

        gastoMov1: getValue('gasto-mov-1'),
        gastoMov2: getValue('gasto-mov-2'),
        gastoMov3: getValue('gasto-mov-3'),
        gastoMov4: getValue('gasto-mov-4'),
        gastoMov5: getValue('gasto-mov-5'),

        combustible: getValue('combustible'),
        bono: getValue('bono'),
        parqueo: getValue('parqueo'),
        pasaje: getValue('pasaje'),
        bano: getValue('bano'),

        billetes: getValue('billetes'),
        b5: getValue('b5'),
        b2: getValue('b2'),
        b1: getValue('b1'),
        b050: getValue('b050'),
        b020: getValue('b020'),
        b010: getValue('b010'),

        bcpYape: getValue('bcp-yape'),
        interbank: getValue('interbank'),
        bbva: getValue('bbva'),

        deudor1: getValue('deudor1'),
        deudor2: getValue('deudor2'),
        deudor3: getValue('deudor3'),
        deudor4: getValue('deudor4'),
        deudor5: getValue('deudor5'),
        deudor6: getValue('deudor6'),

        subtotalVentas: document.getElementById('subtotal-ventas').textContent,
        totalGastos: document.getElementById('total-gastos').textContent,
        subtotalEfectivo: document.getElementById('subtotal-efectivo').textContent,
        subtotalDeposito: document.getElementById('subtotal-deposito').textContent,
        totalFinal: document.getElementById('total-final').textContent,
        diferencia: document.getElementById('resultado').textContent
    };

    let historial = JSON.parse(localStorage.getItem('historialCuadres') || '[]');

    if (cuadreEnEdicion !== null) {
        historial[cuadreEnEdicion] = cuadre;
        cuadreEnEdicion = null;
        localStorage.setItem('historialCuadres', JSON.stringify(historial));
        alert('✅ Cuadre actualizado exitosamente para ' + responsable);
        return;
    }

    const indexExistente = historial.findIndex(c =>
        c.fecha === fecha &&
        c.responsable.toLowerCase() === responsable.toLowerCase()
    );

    if (indexExistente !== -1) {
        alert(`❌ Ya existe un cuadre de "${responsable}" para la fecha ${fecha}`);
        return;
    } else {
        historial.push(cuadre);
    }

    localStorage.setItem('historialCuadres', JSON.stringify(historial));
    alert('✅ Cuadre guardado exitosamente para ' + responsable);
}


/* =========================
        VER HISTORIAL
========================= */

document.getElementById("btn-historial")
    .addEventListener("click", verHistorial);

function verHistorial() {
    const modal = document.getElementById('modal-historial');
    const lista = document.getElementById('lista-historial');

    let historial = JSON.parse(localStorage.getItem('historialCuadres') || '[]');

    if (historial.length === 0) {
        lista.innerHTML = '<div class="no-historial">No hay cuadres guardados</div>';
    } else {
        historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        lista.innerHTML = historial.map((cuadre, index) => `
            <div class="historial-item">
                <h3>👤 ${cuadre.responsable} - 📅 ${cuadre.fecha}</h3>
                <div class="historial-datos">
                    <div><strong>Ruta/Sede:</strong> ${cuadre.rutaSede || 'N/A'}</div>
                    <div><strong>Subtotal Ventas:</strong> ${cuadre.subtotalVentas}</div>
                    <div><strong>Total Gastos:</strong> ${cuadre.totalGastos}</div>
                    <div><strong>Subtotal Efectivo:</strong> ${cuadre.subtotalEfectivo}</div>
                    <div><strong>Subtotal Depósito:</strong> ${cuadre.subtotalDeposito}</div>
                    <div><strong>Total Final:</strong> ${cuadre.totalFinal}</div>
                    <div class="diferencia-highlight"><strong>Diferencia:</strong> ${cuadre.diferencia}</div>
                </div>
                <button onclick="cargarCuadre(${index})">✏️ CARGAR / EDITAR</button>
                <button onclick="eliminarCuadre(${index})" class="btn-eliminar">🗑 ELIMINAR</button>
            </div>
        `).join('');
    }

    modal.style.display = 'block';
}


/* =========================
        CARGAR CUADRE
========================= */

function cargarCuadre(index) {
    let historial = JSON.parse(localStorage.getItem('historialCuadres') || '[]');
    const cuadre = historial[index];

    if (confirm('¿Deseas cargar este cuadre para editarlo?')) {

        cuadreEnEdicion = index;

        document.getElementById('fecha').value = cuadre.fecha;
        document.querySelector('.input-field').value = cuadre.responsable;
        document.querySelectorAll('.input-field')[1].value = cuadre.rutaSede;

        document.getElementById('total-ventas').value = cuadre.totalVentas;
        document.getElementById('fuera-ruta').value = cuadre.fueraRuta;
        document.getElementById('campo-3').value = cuadre.campo3;
        document.getElementById('campo-4').value = cuadre.campo4;
        document.getElementById('productos-no-desp').value = cuadre.productosNoDespachados;
        document.getElementById('devoluciones').value = cuadre.devoluciones;
        document.getElementById('dcto-mercaderia').value = cuadre.dctoMercaderia;

        document.getElementById('gasto-mov-1').value = cuadre.gastoMov1;
        document.getElementById('gasto-mov-2').value = cuadre.gastoMov2;
        document.getElementById('gasto-mov-3').value = cuadre.gastoMov3;
        document.getElementById('gasto-mov-4').value = cuadre.gastoMov4;
        document.getElementById('gasto-mov-5').value = cuadre.gastoMov5;

        document.getElementById('combustible').value = cuadre.combustible;
        document.getElementById('bono').value = cuadre.bono;
        document.getElementById('parqueo').value = cuadre.parqueo;
        document.getElementById('pasaje').value = cuadre.pasaje;
        document.getElementById('bano').value = cuadre.bano;

        document.getElementById('billetes').value = cuadre.billetes;
        document.getElementById('b5').value = cuadre.b5;
        document.getElementById('b2').value = cuadre.b2;
        document.getElementById('b1').value = cuadre.b1;
        document.getElementById('b050').value = cuadre.b050;
        document.getElementById('b020').value = cuadre.b020;
        document.getElementById('b010').value = cuadre.b010;

        document.getElementById('bcp-yape').value = cuadre.bcpYape;
        document.getElementById('interbank').value = cuadre.interbank;
        document.getElementById('bbva').value = cuadre.bbva;

        document.getElementById('deudor1').value = cuadre.deudor1;
        document.getElementById('deudor2').value = cuadre.deudor2;
        document.getElementById('deudor3').value = cuadre.deudor3;
        document.getElementById('deudor4').value = cuadre.deudor4;
        document.getElementById('deudor5').value = cuadre.deudor5;
        document.getElementById('deudor6').value = cuadre.deudor6;

        updateCalculations();
        document.getElementById('modal-historial').style.display = 'none';

        alert('✅ Cuadre cargado. Edita y presiona GUARDAR.');
    }
}

/* =========================
       ELIMINAR CUADRE
========================= */

function eliminarCuadre(index) {

    let historial = JSON.parse(localStorage.getItem('historialCuadres') || '[]');

    const cuadre = historial[index];

    const confirmacion = confirm(
        `¿Seguro que deseas eliminar el cuadre de:\n\n👤 ${cuadre.responsable}\n📅 ${cuadre.fecha}?`
    );

    if (!confirmacion) return;

    historial.splice(index, 1);

    localStorage.setItem('historialCuadres', JSON.stringify(historial));

    alert('🗑 Cuadre eliminado correctamente');

    verHistorial();
}


/* =========================
        CERRAR MODAL
========================= */

document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('modal-historial').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-historial');
    if (e.target === modal) modal.style.display = 'none';
});

