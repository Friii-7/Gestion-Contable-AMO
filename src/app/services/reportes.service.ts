import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface FiltroReporte {
  tipo: 'diario' | 'semanal' | 'mensual';
  fechaInicio: Date;
  fechaFin: Date;
  descripcion: string;
}

export interface ColumnaReporte {
  header: string;
  dataKey: string;
  width?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  /**
   * Genera un reporte en PDF
   */
  generarPDF(
    titulo: string,
    datos: any[],
    columnas: ColumnaReporte[],
    filtro?: FiltroReporte
  ): void {
    const doc = new jsPDF();

    // Título del reporte
    doc.setFontSize(18);
    doc.text(titulo, 14, 22);

    // Información del filtro si existe
    if (filtro) {
      doc.setFontSize(12);
      doc.text(`Período: ${filtro.descripcion}`, 14, 32);
      doc.text(`Desde: ${filtro.fechaInicio.toLocaleDateString('es-CO')}`, 14, 40);
      doc.text(`Hasta: ${filtro.fechaFin.toLocaleDateString('es-CO')}`, 14, 48);
    }

    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 56);

    // Tabla de datos
    const tableData = datos.map(item =>
      columnas.map(col => item[col.dataKey])
    );

    autoTable(doc, {
      head: [columnas.map(col => col.header)],
      body: tableData,
      startY: filtro ? 65 : 35,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: columnas.reduce((acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width };
        }
        return acc;
      }, {} as any)
    });

    // Guardar archivo
    const nombreArchivo = `${titulo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
  }

  /**
   * Genera un reporte en Excel
   */
  generarExcel(
    titulo: string,
    datos: any[],
    columnas: ColumnaReporte[],
    filtro?: FiltroReporte
  ): void {
    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();

    // Preparar datos para Excel
    const excelData = [
      [titulo], // Título
      [], // Línea en blanco
    ];

    // Agregar información del filtro si existe
    if (filtro) {
      excelData.push(
        [`Período: ${filtro.descripcion}`],
        [`Desde: ${filtro.fechaInicio.toLocaleDateString('es-CO')}`],
        [`Hasta: ${filtro.fechaFin.toLocaleDateString('es-CO')}`],
        [] // Línea en blanco
      );
    }

    // Agregar fecha de generación
    excelData.push(
      [`Generado: ${new Date().toLocaleString('es-CO')}`],
      [] // Línea en blanco
    );

    // Agregar encabezados
    excelData.push(columnas.map(col => col.header));

    // Agregar datos
    datos.forEach(item => {
      excelData.push(columnas.map(col => item[col.dataKey]));
    });

    // Crear worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Aplicar estilos básicos
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Estilo para el título
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, size: 16 },
        alignment: { horizontal: 'center' }
      };
    }

    // Estilo para los encabezados
    const headerRow = filtro ? (filtro ? 8 : 4) : 4;
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2980B9" } }
        };
      }
    }

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    // Generar archivo y descargar
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const nombreArchivo = `${titulo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, nombreArchivo);
  }

  /**
   * Calcula fechas para filtros predefinidos
   */
  calcularFiltrosPredefinidos(): FiltroReporte[] {
    const hoy = new Date();
    const inicioDia = new Date(hoy);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(hoy);
    finDia.setHours(23, 59, 59, 999);

    // Semana actual (lunes a domingo)
    const inicioSemana = new Date(hoy);
    const diaSemana = hoy.getDay();
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    inicioSemana.setDate(hoy.getDate() - diasDesdeLunes);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    // Mes actual
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

    return [
      {
        tipo: 'diario',
        fechaInicio: inicioDia,
        fechaFin: finDia,
        descripcion: 'Hoy'
      },
      {
        tipo: 'semanal',
        fechaInicio: inicioSemana,
        fechaFin: finSemana,
        descripcion: 'Esta semana'
      },
      {
        tipo: 'mensual',
        fechaInicio: inicioMes,
        fechaFin: finMes,
        descripcion: 'Este mes'
      }
    ];
  }

  /**
   * Filtra datos por rango de fechas
   */
  filtrarPorFechas<T extends { fechaRegistro?: any; fecha?: any }>(
    datos: T[],
    fechaInicio: Date,
    fechaFin: Date
  ): T[] {
    return datos.filter(item => {
      const fecha = item.fechaRegistro || item.fecha;
      if (!fecha) return false;

      const fechaItem = fecha instanceof Date ? fecha : fecha.toDate();
      return fechaItem >= fechaInicio && fechaItem <= fechaFin;
    });
  }
}
