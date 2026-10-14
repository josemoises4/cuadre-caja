
/* =========================
   FORMATEO Y UTILIDADES
========================= */

function formatNumber(num) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
    }).format(Number(num) || 0);
}

function getValue(id) {
    const element = document.getElementById(id);
    if (!element) return 0;

    const value = String(element.value ?? '').replace(',', '.');
    const number = parseFloat(value);

    return Number.isFinite(number) ? number : 0;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? '';
}

function getHistorial() {
    try {
        const historial = JSON.parse(
            localStorage.getItem('historialCuadres') || '[]'
        );

        return Array.isArray(historial) ? historial : [];
    } catch (error) {
        console.error('Error al leer el historial:', error);
        return [];
    }
}

function guardarHistorial(historial) {
    localStorage.setItem('historialCuadres', JSON.stringify(historial));
}

function fechaLocalHoy() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[caracter]);
}

let cuadreEnEdicion = null;


/* =========================
   FILAS DINÁMICAS
========================= */

const CLIENTES_INICIALES = 7;
const GASTOS_INICIALES = 5;

function obtenerFilasClientes() {
    const cuerpo = document.getElementById('clientes-body');
    return cuerpo ? Array.from(cuerpo.querySelectorAll('tr')) : [];
}

function obtenerFilasGastos() {
    const cuerpo = document.getElementById('gastos-operativos-body');
    return cuerpo ? Array.from(cuerpo.querySelectorAll('tr')) : [];
}

/*
 * Crea una fila de cliente copiando la estructura
 * de la última fila existente.
 */
function agregarFilaCliente() {
    const cuerpo = document.getElementById('clientes-body');
    if (!cuerpo) return false;

    const filas = obtenerFilasClientes();
    const ultimaFila = filas[filas.length - 1];

    if (!ultimaFila) return false;

    const nuevaFila = ultimaFila.cloneNode(true);
    const numero = filas.length + 1;

    nuevaFila.querySelectorAll('input').forEach(input => {
        if (input.classList.contains('nombre-cliente') ||
            input.classList.contains('importe-cliente')) {
            input.value = '';
        }

        if (input.classList.contains('nombre-cliente')) {
            input.id = `nombre-cliente-${numero}`;
        }

        if (input.classList.contains('importe-cliente')) {
            input.id = `deudor${numero}`;
        }
    });

    cuerpo.appendChild(nuevaFila);

    // Por cada nuevo cliente, se agrega un gasto operativo.
    agregarFilaGasto();

    return true;
}

/*
 * Crea un gasto operativo copiando la estructura
 * de la última fila de gastos.
 */
function agregarFilaGasto() {
    const cuerpo = document.getElementById('gastos-operativos-body');
    if (!cuerpo) return false;

    const filas = obtenerFilasGastos();
    const ultimaFila = filas[filas.length - 1];

    if (!ultimaFila) return false;

    const nuevaFila = ultimaFila.cloneNode(true);
    const numero = filas.length + 1;

    nuevaFila.querySelectorAll('input').forEach(input => {
        if (input.id.startsWith('gasto-mov-')) {
            input.id = `gasto-mov-${numero}`;
            input.value = '';
        }

        if (input.classList.contains('input-label')) {
            input.value = `${numero}.`;
        }
    });

    cuerpo.appendChild(nuevaFila);
    actualizarRowspanGastos();

    return true;
}

function actualizarRowspanGastos() {
    const encabezado = document.getElementById('gastos-operativos-header');
    const cantidad = obtenerFilasGastos().length;

    if (encabezado && cantidad > 0) {
        encabezado.rowSpan = cantidad;
    }
}

/*
 * Garantiza la cantidad necesaria de filas.
 * Si se necesita reducirlas, elimina las sobrantes.
 */
function ajustarFilasClientes(cantidad) {
    const cuerpo = document.getElementById('clientes-body');
    if (!cuerpo) return;

    cantidad = Math.max(CLIENTES_INICIALES, cantidad);

    while (obtenerFilasClientes().length > cantidad) {
        cuerpo.lastElementChild.remove();
    }

    while (obtenerFilasClientes().length < cantidad) {
        const filasAntes = obtenerFilasClientes().length;

        if (!agregarFilaCliente()) break;

        /*
         * Al reconstruir clientes también se crean gastos.
         * Los gastos se ajustan por separado después.
         */
        if (obtenerFilasClientes().length === filasAntes) break;
    }
}

function ajustarFilasGastos(cantidad) {
    const cuerpo = document.getElementById('gastos-operativos-body');
    if (!cuerpo) return;

    cantidad = Math.max(GASTOS_INICIALES, cantidad);

    while (obtenerFilasGastos().length > cantidad) {
        cuerpo.lastElementChild.remove();
    }

    while (obtenerFilasGastos().length < cantidad) {
        if (!agregarFilaGasto()) break;
    }

    actualizarRowspanGastos();
}

/*
 * Restaura la cantidad inicial de filas sin conservar
 * filas dinámicas del cuadre anterior.
 */
function restaurarFilasIniciales() {
    const cuerpoClientes = document.getElementById('clientes-body');
    const cuerpoGastos = document.getElementById('gastos-operativos-body');

    if (cuerpoClientes) {
        while (obtenerFilasClientes().length > CLIENTES_INICIALES) {
            cuerpoClientes.lastElementChild.remove();
        }
    }

    if (cuerpoGastos) {
        while (obtenerFilasGastos().length > GASTOS_INICIALES) {
            cuerpoGastos.lastElementChild.remove();
        }
    }

    actualizarRowspanGastos();
}


/* =========================
   CÁLCULOS
========================= */

function updateCalculations() {

    /* -------- VENTAS -------- */

    const sumaVentas =
        getValue('total-ventas') +
        getValue('fuera-ruta') +
        getValue('campo-3') +
        getValue('campo-4');

    const subtotalVentas =
        sumaVentas -
        getValue('productos-no-desp') -
        getValue('devoluciones') -
        getValue('dcto-mercaderia');

    setText('subtotal-ventas', formatNumber(subtotalVentas));


    /* -------- GASTOS OPERATIVOS -------- */

    const totalGastosMovilidad = obtenerFilasGastos().reduce(
        (total, fila) => {
            const input = fila.querySelector('input[id^="gasto-mov-"]');
            if (!input) return total;

            return total + getValue(input.id);
        },
        0
    );

        // BONO AUTOMÁTICO
        const total = getValue('total-ventas');

        if (total >= 9000) {
            const bono = Math.floor(total * 0.005 * 100) / 100;
            document.getElementById('bono').value = bono.toFixed(2);
        } else {
            document.getElementById('bono').value = '';
        }

    /* -------- OTROS GASTOS -------- */

    const totalGastosOtros =
        getValue('combustible') +
        getValue('bono') +
        getValue('parqueo') +
        getValue('pasaje') +
        getValue('bano');

    const totalGastos =
        subtotalVentas - totalGastosMovilidad - totalGastosOtros;

    setText('total-gastos', formatNumber(totalGastos));


    /* -------- EFECTIVO -------- */

    const subtotalEfectivo =
        getValue('billetes') +
        getValue('b5') +
        getValue('b2') +
        getValue('b1') +
        getValue('b050') +
        getValue('b020') +
        getValue('b010');

    setText('subtotal-efectivo', formatNumber(subtotalEfectivo));


    /* -------- DEPÓSITOS -------- */

    const subtotalDeposito =
        getValue('bcp-yape') +
        getValue('interbank') +
        getValue('bbva');

    setText('subtotal-deposito', formatNumber(subtotalDeposito));


    /* -------- DEUDORES DINÁMICOS -------- */

    const totalDeudores = obtenerFilasClientes().reduce(
        (total, fila) => {
            const input = fila.querySelector('.importe-cliente');
            if (!input) return total;

            return total + getValue(input.id);
        },
        0
    );


    /* -------- TOTAL FINAL -------- */

    const totalFinal =
        subtotalEfectivo + subtotalDeposito + totalDeudores;

    setText('total-final', formatNumber(totalFinal));


    /* -------- DIFERENCIA -------- */

    const diferencia = totalFinal - totalGastos;
    const filaResultado = document.getElementById('resultado-row');
    const resultado = document.getElementById('resultado');

    if (!filaResultado || !resultado) return;

    filaResultado.classList.remove(
        'resultado-ok',
        'resultado-falta',
        'resultado-cuadra'
    );

    resultado.textContent = formatNumber(diferencia);

    if (diferencia > 0) {
        filaResultado.classList.add('resultado-ok');
    } else if (diferencia < 0) {
        filaResultado.classList.add('resultado-falta');
    } else {
        filaResultado.classList.add('resultado-cuadra');
    }
}


/* =========================
   DATOS DEL FORMULARIO
========================= */

const CAMPOS_FIJOS = [
    'total-ventas',
    'fuera-ruta',
    'campo-3',
    'campo-4',
    'productos-no-desp',
    'devoluciones',
    'dcto-mercaderia',
    'combustible',
    'bono',
    'parqueo',
    'pasaje',
    'bano',
    'billetes',
    'b5',
    'b2',
    'b1',
    'b050',
    'b020',
    'b010',
    'bcp-yape',
    'interbank',
    'bbva'
];

function recopilarDatosFormulario() {
    const campos = {};

    CAMPOS_FIJOS.forEach(id => {
        campos[id] = getValue(id);
    });

    const camposTexto = document.querySelectorAll('.input-field');

    const clientes = obtenerFilasClientes().map(fila => ({
        nombre: fila.querySelector('.nombre-cliente')?.value.trim() || '',
        importe: getValue(fila.querySelector('.importe-cliente')?.id)
    }));

    const gastosOperativos = obtenerFilasGastos().map(fila => {
        const input = fila.querySelector('input[id^="gasto-mov-"]');
        return input ? getValue(input.id) : 0;
    });

    const datos = {
        ...campos,
        fecha: document.getElementById('fecha')?.value || '',
        responsable: camposTexto[0]?.value.trim() || '',
        rutaSede: camposTexto[1]?.value.trim() || '',
        clientes,
        gastosOperativos,

        subtotalVentas: document.getElementById('subtotal-ventas')?.textContent || '',
        totalGastos: document.getElementById('total-gastos')?.textContent || '',
        subtotalEfectivo: document.getElementById('subtotal-efectivo')?.textContent || '',
        subtotalDeposito: document.getElementById('subtotal-deposito')?.textContent || '',
        totalFinal: document.getElementById('total-final')?.textContent || '',
        diferencia: document.getElementById('resultado')?.textContent || ''
    };

    // Conserva compatibilidad con los registros anteriores.
    gastosOperativos.forEach((valor, indice) => {
        datos[`gastoMov${indice + 1}`] = valor;
    });

    clientes.forEach((cliente, indice) => {
        datos[`deudor${indice + 1}`] = cliente.importe;
    });

    return datos;
}


/* =========================
   EVENTOS E INICIALIZACIÓN
========================= */

function addEventListeners() {
    /*
     * Delegación de eventos: también funciona con inputs
     * que se creen después de cargar la página.
     */
    document.addEventListener('input', event => {
        const input = event.target;

        if (input.matches('.nombre-cliente')) {
            const filas = obtenerFilasClientes();
            const ultimaFila = filas[filas.length - 1];

            /*
             * Solo crea una fila cuando se escribe en el
             * nombre de la última fila disponible.
             */
            if (
                ultimaFila &&
                ultimaFila.contains(input) &&
                input.value.trim() !== ''
            ) {
                agregarFilaCliente();
            }
        }

        if (
            input.matches('input[type="number"]') ||
            input.matches('.importe-cliente')
        ) {
            updateCalculations();
        }
    });

    document.addEventListener('change', event => {
        if (event.target.matches('input')) {
            updateCalculations();
        }
    });

    document.addEventListener('paste', () => {
        setTimeout(updateCalculations, 100);
    });

    const btnLimpiar = document.getElementById('btn-limpiar');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarTodo);

    const btnGuardar = document.getElementById('btn-guardar');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarCuadre);

    const btnHistorial = document.getElementById('btn-historial');
    if (btnHistorial) btnHistorial.addEventListener('click', verHistorial);

    const cerrarModal = document.querySelector('.close-modal');
    if (cerrarModal) {
        cerrarModal.addEventListener('click', () => {
            const modal = document.getElementById('modal-historial');
            if (modal) modal.style.display = 'none';
        });
    }

    window.addEventListener('click', event => {
        const modal = document.getElementById('modal-historial');

        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    });

    const btnReparto = document.getElementById('btn-reparto');
    const submenu = document.getElementById('submenu-reparto');

    if (btnReparto && submenu) {
        btnReparto.addEventListener('click', () => {
            submenu.classList.toggle('open');
            btnReparto.classList.toggle('open');
        });
    }

    const btnImprimir = document.getElementById('btn-imprimir');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', imprimirCuadre);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarRowspanGastos();
    addEventListeners();
    updateCalculations();
});


/* =========================
   LIMPIEZA TOTAL
========================= */

function limpiarTodo() {
    cuadreEnEdicion = null;

    restaurarFilasIniciales();

    document.querySelectorAll('input').forEach(input => {
        if (input.type === 'number') {
            input.value = '';
        } else if (input.type === 'date') {
            input.value = fechaLocalHoy();
        } else if (input.type === 'text') {
            if (
                !input.classList.contains('input-label') &&
                input.value !== 'GENERAL'
            ) {
                input.value = '';
            }
        }
    });

    updateCalculations();
}


/* =========================
   GUARDAR CUADRE
========================= */

function guardarCuadre() {
    updateCalculations();

    const datos = recopilarDatosFormulario();
    const fecha = datos.fecha;
    const responsable = datos.responsable;

    if (!fecha) {
        alert('❌ Por favor selecciona una fecha antes de guardar.');
        return;
    }

    if (!responsable) {
        alert('❌ Por favor ingresa el nombre del RESPONSABLE antes de guardar.');
        return;
    }

    const hayDatosFijos = CAMPOS_FIJOS.some(id => {
        const input = document.getElementById(id);
        return input && input.value.trim() !== '';
    });

    const hayDatosClientes = datos.clientes.some(cliente =>
        cliente.nombre !== '' || cliente.importe !== 0
    );

    const hayDatosGastos = datos.gastosOperativos.some(valor => valor !== 0);

    if (!hayDatosFijos && !hayDatosClientes && !hayDatosGastos) {
        alert('❌ No puedes guardar un cuadre vacío. Debes ingresar datos primero.');
        return;
    }

    let historial = getHistorial();

    if (cuadreEnEdicion !== null) {
        if (historial[cuadreEnEdicion]) {
            const duplicado = historial.some((cuadre, indice) =>
                indice !== cuadreEnEdicion &&
                cuadre.fecha === fecha &&
                String(cuadre.responsable || '').toLowerCase() === responsable.toLowerCase()
            );

            if (duplicado) {
                alert(`❌ Ya existe un cuadre de "${responsable}" para la fecha ${fecha}.`);
                return;
            }

            historial[cuadreEnEdicion] = datos;
            guardarHistorial(historial);
            cuadreEnEdicion = null;

            alert('✅ Cuadre actualizado exitosamente para ' + responsable);
            return;
        }

        cuadreEnEdicion = null;
    }

    const indexExistente = historial.findIndex(cuadre =>
        cuadre.fecha === fecha &&
        String(cuadre.responsable || '').toLowerCase() === responsable.toLowerCase()
    );

    if (indexExistente !== -1) {
        alert(`❌ Ya existe un cuadre de "${responsable}" para la fecha ${fecha}.`);
        return;
    }

    historial.push(datos);
    guardarHistorial(historial);

    alert('✅ Cuadre guardado exitosamente para ' + responsable);
}


/* =========================
   VER HISTORIAL
========================= */

function verHistorial() {
    const modal = document.getElementById('modal-historial');
    const lista = document.getElementById('lista-historial');

    if (!modal || !lista) return;

    const historial = getHistorial();

    if (historial.length === 0) {
        lista.innerHTML = '<div class="no-historial">No hay cuadres guardados</div>';
    } else {
        /*
         * Conserva el índice original para que los botones
         * carguen y eliminen el registro correcto.
         */
        const ordenados = historial
            .map((cuadre, indiceOriginal) => ({ cuadre, indiceOriginal }))
            .sort((a, b) =>
                new Date(b.cuadre.fecha) - new Date(a.cuadre.fecha)
            );

        lista.innerHTML = ordenados.map(({ cuadre, indiceOriginal }) => `
            <div class="historial-item">
                <h3>👤 ${escaparHTML(cuadre.responsable)} - 📅 ${escaparHTML(cuadre.fecha)}</h3>
                <div class="historial-datos">
                    <div><strong>Ruta/Sede:</strong> ${escaparHTML(cuadre.rutaSede || 'N/A')}</div>
                    <div><strong>Subtotal Ventas:</strong> ${escaparHTML(cuadre.subtotalVentas || formatNumber(0))}</div>
                    <div><strong>Total Gastos:</strong> ${escaparHTML(cuadre.totalGastos || formatNumber(0))}</div>
                    <div><strong>Subtotal Efectivo:</strong> ${escaparHTML(cuadre.subtotalEfectivo || formatNumber(0))}</div>
                    <div><strong>Subtotal Depósito:</strong> ${escaparHTML(cuadre.subtotalDeposito || formatNumber(0))}</div>
                    <div><strong>Total Final:</strong> ${escaparHTML(cuadre.totalFinal || formatNumber(0))}</div>
                    <div class="diferencia-highlight"><strong>Diferencia:</strong> ${escaparHTML(cuadre.diferencia || formatNumber(0))}</div>
                </div>
                <button type="button" onclick="cargarCuadre(${indiceOriginal})">✏️ CARGAR / EDITAR</button>
                <button type="button" onclick="eliminarCuadre(${indiceOriginal})" class="btn-eliminar">🗑 ELIMINAR</button>
            </div>
        `).join('');
    }

    modal.style.display = 'block';
}


/* =========================
   CARGAR / EDITAR CUADRE
========================= */

function cargarCuadre(index) {
    const historial = getHistorial();
    const cuadre = historial[index];

    if (!cuadre) {
        alert('No se encontró el cuadre seleccionado.');
        return;
    }

    if (!confirm('¿Deseas cargar este cuadre para editarlo?')) return;

    cuadreEnEdicion = index;

    /*
     * Primero elimina las filas adicionales anteriores.
     * Después reconstruye las filas guardadas.
     */
    restaurarFilasIniciales();

    const clientesGuardados = Array.isArray(cuadre.clientes)
        ? cuadre.clientes
        : Array.from({ length: CLIENTES_INICIALES }, (_, indice) => ({
            nombre: '',
            importe: cuadre[`deudor${indice + 1}`] ?? 0
        }));

    const gastosGuardados = Array.isArray(cuadre.gastosOperativos)
        ? cuadre.gastosOperativos
        : Array.from({ length: GASTOS_INICIALES }, (_, indice) =>
            cuadre[`gastoMov${indice + 1}`] ?? 0
        );

    ajustarFilasClientes(Math.max(CLIENTES_INICIALES, clientesGuardados.length));

    /*
     * ajustarFilasClientes también crea un gasto por cada
     * fila nueva; se ajusta luego a la cantidad guardada.
     */
    ajustarFilasGastos(Math.max(GASTOS_INICIALES, gastosGuardados.length));

    setValue('fecha', cuadre.fecha || '');
    setValue('total-ventas', cuadre['total-ventas'] ?? cuadre.totalVentas);
    setValue('fuera-ruta', cuadre.fueraRuta);
    setValue('campo-3', cuadre.campo3);
    setValue('campo-4', cuadre.campo4);
    setValue('productos-no-desp', cuadre.productosNoDespachados);
    setValue('devoluciones', cuadre.devoluciones);
    setValue('dcto-mercaderia', cuadre.dctoMercaderia);

    CAMPOS_FIJOS.forEach(id => {
        if (Object.prototype.hasOwnProperty.call(cuadre, id)) {
            setValue(id, cuadre[id]);
        }
    });

    const camposTexto = document.querySelectorAll('.input-field');
    if (camposTexto[0]) camposTexto[0].value = cuadre.responsable || '';
    if (camposTexto[1]) camposTexto[1].value = cuadre.rutaSede || '';

    obtenerFilasGastos().forEach((fila, indice) => {
        const input = fila.querySelector('input[id^="gasto-mov-"]');
        if (input) input.value = gastosGuardados[indice] ?? 0;
    });

    obtenerFilasClientes().forEach((fila, indice) => {
        const cliente = clientesGuardados[indice] || {};
        const nombre = fila.querySelector('.nombre-cliente');
        const importe = fila.querySelector('.importe-cliente');

        if (nombre) nombre.value = cliente.nombre || '';
        if (importe) importe.value = cliente.importe ?? 0;
    });

    actualizarRowspanGastos();
    updateCalculations();

    const modal = document.getElementById('modal-historial');
    if (modal) modal.style.display = 'none';

    alert('✅ Cuadre cargado. Edita y presiona GUARDAR.');
}


/* =========================
   ELIMINAR CUADRE
========================= */

function eliminarCuadre(index) {
    const historial = getHistorial();
    const cuadre = historial[index];

    if (!cuadre) return;

    const confirmacion = confirm(
        `¿Seguro que deseas eliminar el cuadre de:\n\n` +
        `👤 ${cuadre.responsable}\n📅 ${cuadre.fecha}?`
    );

    if (!confirmacion) return;

    historial.splice(index, 1);
    guardarHistorial(historial);

    alert('🗑 Cuadre eliminado correctamente');

    verHistorial();
}


/* =========================
   GENERAR PDF
========================= */

async function imprimirCuadre() {
    try {
        const area = document.getElementById('area-imprimir');

        if (!area) {
            alert('No se encontró el área que se desea imprimir.');
            return;
        }

        if (typeof html2canvas !== 'function' || !window.jspdf) {
            alert('No se encontraron las librerías necesarias para generar el PDF.');
            return;
        }

        const canvas = await html2canvas(area, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const margen = 8;
        const anchoDisponible = pageWidth - margen * 2;
        const altoDisponible = pageHeight - margen * 2;

        const proporcion = canvas.width / canvas.height;

        let ancho = anchoDisponible;
        let alto = ancho / proporcion;

        if (alto > altoDisponible) {
            alto = altoDisponible;
            ancho = alto * proporcion;
        }

        const x = (pageWidth - ancho) / 2;
        const y = (pageHeight - alto) / 2;

        pdf.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            x,
            y,
            ancho,
            alto
        );

        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        window.open(pdfUrl, '_blank');

    } catch (error) {
        console.error(error);
        alert('Error al generar el PDF: ' + error.message);
    }
}
