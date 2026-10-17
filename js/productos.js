
const formato = n => 'S/.' + n.toFixed(2).replace('.', ',');

const filas = document.querySelectorAll('tbody tr');
const cantidadTotal = document.getElementById('cantidad-total');
const totalGeneral = document.getElementById('total-general');
const btnLimpiar = document.getElementById('btn-limpiar');
const btnPdf = document.getElementById('btn-pdf');
const btnCompartir = document.getElementById('btn-compartir');
let pdfGenerado = null;
const inputCliente = document.getElementById('cliente');
const inputDni = document.getElementById('dni');

// Notificaciones
const notificacion = document.getElementById('notificacion');

function mostrarNotificacion(mensaje, tipo = 'exito') {
  if (!notificacion) {
    alert(mensaje);
    return;
  }

  notificacion.textContent = mensaje;
  notificacion.className = `notificacion ${tipo}`;
}

// El DNI solo acepta números
inputDni.addEventListener('input', () => {
  inputDni.value = inputDni.value.replace(/\D/g, '');
});

/* =========================
        MENÚ LATERAL
========================= */
const btnReparto = document.getElementById('btn-reparto');
const submenu = document.getElementById('submenu-reparto');

btnReparto.addEventListener('click', () => {
  submenu.classList.toggle('open');
  btnReparto.classList.toggle('open');
});

/* =========================
          CÁLCULOS
========================= */
document.querySelectorAll('.precio').forEach(td => {
  td.textContent = formato(parseFloat(td.dataset.precio));
});

function calcular() {
  let cant = 0, total = 0;

  filas.forEach(fila => {
    const q = parseInt(fila.querySelector('input').value) || 0;
    const p = parseFloat(fila.querySelector('.precio').dataset.precio);

    fila.querySelector('.total').textContent = formato(q * p);
    cant += q;
    total += q * p;
  });

  cantidadTotal.textContent = cant;
  totalGeneral.textContent = formato(total);
}

document.querySelectorAll('tbody input').forEach(i =>
  i.addEventListener('input', calcular)
);

/* =========================
           LIMPIAR
========================= */
btnLimpiar.addEventListener('click', () => {
  document.querySelectorAll('tbody input').forEach(i => i.value = '');
  inputCliente.value = '';
  inputDni.value = '';
  calcular();
});

/* =========================
         GENERAR PDF
   Formato ticket (80 mm) - NOTA DE PEDIDO
========================= */
btnPdf.addEventListener('click', async () => {
  // Invalidar el PDF anterior antes de generar uno nuevo
  pdfGenerado = null;
  btnCompartir.disabled = true;

  if (notificacion) {
    notificacion.className = 'notificacion';
    notificacion.textContent = '';
  }

  // 1) Reunir solo los productos con cantidad
  const seleccion = [];
  let cant = 0, total = 0;

  filas.forEach(fila => {
    const q = parseInt(fila.querySelector('input').value) || 0;
    if (q <= 0) return;

    const p = parseFloat(fila.querySelector('.precio').dataset.precio);
    const cat = fila.dataset.categoria || '';
    const nombre = fila.querySelector('.producto').textContent
      .replace(/\s+/g, ' ')
      .trim();

    seleccion.push({ cat, nombre, q, p });
    cant += q;
    total += q * p;
  });

  if (seleccion.length === 0) {
    mostrarNotificacion(
      'No has seleccionado ningún producto. Ingresa una cantidad primero.',
      'error'
    );
    return;
  }

  if (!window.html2canvas || !window.jspdf) {
    mostrarNotificacion(
      'No se pudo cargar la librería de PDF. Revisa tu conexión a internet.',
      'error'
    );
    return;
  }

  // Abrir la pestaña dentro del clic para evitar que el navegador la bloquee
  const ventana = window.open('', '_blank');

  // Elementos del ticket definidos en productos.html
  const area = document.getElementById('area-pdf');
  const tkLogo = document.getElementById('tk-logo');
  const tkLogoTexto = document.getElementById('tk-logo-texto');
  const tkCliente = document.getElementById('tk-cliente');
  const tkDni = document.getElementById('tk-dni');
  const tkFecha = document.getElementById('tk-fecha');
  const tkFilas = document.getElementById('tk-filas');
  const tkUnid = document.getElementById('tk-unid');
  const tkTotal = document.getElementById('tk-total');

  const num = n => n.toFixed(2).replace('.', ',');

  // 2) Rellenar el ticket con los datos
  const llenar = conLogo => {
    tkLogo.hidden = !conLogo;
    tkLogoTexto.hidden = conLogo;

    tkCliente.textContent = inputCliente.value.trim().toUpperCase() || '-';
    tkDni.textContent = inputDni.value.trim() || '-';
    tkFecha.textContent = new Date().toLocaleString('es-PE');
    tkUnid.textContent = cant;
    tkTotal.textContent = formato(total);

    tkFilas.replaceChildren(...seleccion.map(s => {
      const tr = document.createElement('tr');

      [
        (s.cat ? s.cat + ' · ' : '') + s.nombre,
        s.q,
        num(s.p),
        num(s.q * s.p)
      ].forEach(valor => {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.appendChild(td);
      });

      return tr;
    }));
  };

  // 3) Convertir a imagen
  const capturar = async conLogo => {
    llenar(conLogo);

    const canvas = await html2canvas(area, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    return {
      canvas,
      dataUrl: canvas.toDataURL('image/png')
    };
  };

  try {
    // Usar el logo en base64 si está disponible
    if (typeof LOGO_ARTIKA !== 'undefined' && LOGO_ARTIKA) {
      try {
        if (tkLogo.src !== LOGO_ARTIKA) {
          tkLogo.src = LOGO_ARTIKA;
        }

        await tkLogo.decode();
      } catch (e) {
        console.warn('No se pudo leer el logo de logo.js', e);
      }
    }

    const logoCargado = tkLogo.complete && tkLogo.naturalWidth > 0;

    if (!logoCargado) {
      console.warn('No se encontró img/artika-logo.png; el PDF se genera sin logo.');
    }

    let resultado;

    try {
      resultado = await capturar(logoCargado);
    } catch (e) {
      console.warn(
        'No se pudo capturar el logo. Se intentará generar el PDF sin logo.',
        e
      );

      resultado = await capturar(false);
    }

    const { canvas, dataUrl } = resultado;

    // 4) PDF en una sola página tipo ticket de 80 mm
    const { jsPDF } = window.jspdf;
    const anchoMM = 80;
    const altoMM = canvas.height * anchoMM / canvas.width;

    const pdf = new jsPDF({
      orientation: altoMM > anchoMM ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [anchoMM, altoMM]
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, anchoMM, altoMM);

    // 5) Crear el PDF con el nombre del cliente
    const pdfBlob = pdf.output('blob');

    const nombreCliente = inputCliente.value
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, ' ');

    const nombreArchivo = nombreCliente
      ? `NOTA DE VENTA - ${nombreCliente.toUpperCase()}.pdf`
      : 'NOTA DE VENTA.pdf';

    pdfGenerado = new File(
      [pdfBlob],
      nombreArchivo,
      { type: 'application/pdf' }
    );

    // Abrir el PDF en otra pestaña sin descargarlo automáticamente
    const url = URL.createObjectURL(pdfBlob);

    if (ventana) {
      ventana.location.href = url;
    } else {
      window.open(url, '_blank');
    }

    btnCompartir.disabled = false;

    mostrarNotificacion(
      'PDF generado correctamente. Ya puedes compartir la nota de venta.'
    );

  } catch (error) {
    console.error(error);

    if (ventana) ventana.close();

    mostrarNotificacion(
      'Error al generar el PDF: ' + error.message,
      'error'
    );

  } finally {
    tkFilas.replaceChildren();
  }
});


/* =========================
        COMPARTIR PDF
========================= */
btnCompartir.addEventListener('click', async () => {
  if (!pdfGenerado) {
    mostrarNotificacion('Primero debes generar el PDF.', 'error');
    return;
  }

  try {
    // Intentar compartir el archivo PDF desde el teléfono
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [pdfGenerado] })
    ) {
      await navigator.share({
        title: pdfGenerado.name.replace(/\.pdf$/i, ''),
        text: inputCliente.value.trim()
          ? `Hola, te comparto la nota de venta de ${inputCliente.value.trim()}.`
          : 'Hola, te comparto la nota de venta.',
        files: [pdfGenerado]
      });

      mostrarNotificacion('Se completó la acción de compartir.');
      return;
    }

    // Si el navegador no permite compartir archivos,
    // informar al usuario en vez de descargar automáticamente.
    mostrarNotificacion(
      'Tu navegador no permite compartir el PDF directamente. Abre la página desde Chrome o Safari y utiliza una conexión HTTPS.',
      'error'
    );

  } catch (error) {
    if (error.name === 'AbortError') return;

    console.error(error);

    mostrarNotificacion(
      'No se pudo compartir el PDF. Comprueba que la página esté abierta mediante HTTPS.',
      'error'
    );
  }
});
