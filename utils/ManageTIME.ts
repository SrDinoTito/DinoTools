/**
 * ---------------------------- ManageTIME ----------------------------
 * 
 * Clase para calcular la diferencia de tiempo entre una fecha dada y la fecha actual,
 * devolviendo un string en formato “time ago” (hace X tiempo).
 * Soporta entradas como `Date`, `string` o `number`.
 * 
 * ---------------------------------------------------------------------
 */

class ManageTIME {
  /**
   * Calcula cuánto tiempo ha pasado desde `inputDate` hasta ahora y devuelve
   * un string legible tipo "time ago".
   * 
   * @param inputDate - Fecha de entrada. Puede ser:
   *   - `Date` → un objeto Date
   *   - `string` → fecha en formato parseable (ISO, etc.)
   *   - `number` → timestamp en milisegundos
   * 
   * @returns Un string indicando el tiempo transcurrido:
   *   - Menos de 1 minuto: `"X sec ago"`
   *   - Menos de 1 hora: `"X min ago"`
   *   - Menos de 1 día: `"X hrs ago"`
   *   - Más de 1 día: `"X days ago"`
   *   - Fecha inválida: `"Fecha inválida"`
   * 
   * @example
   * const mt = new ManageTIME();
   * mt.getTimeAgo(new Date());           // "0 sec ago"
   * mt.getTimeAgo(Date.now() - 60000);  // "1 min ago"
   * mt.getTimeAgo("2025-08-17T12:00:00Z"); // "X days ago"
   */
  getTimeAgo(inputDate: Date | string | number): string {
    // Convertimos inputDate a fecha válida
    const date = inputDate instanceof Date ? inputDate : new Date(inputDate);

    if (isNaN(date.getTime())) {
      return "Fecha inválida";
    }

    // Obtenemos tiempo actual en UTC
    const nowUTC = new Date();
    const nowTime = Date.UTC(
      nowUTC.getUTCFullYear(),
      nowUTC.getUTCMonth(),
      nowUTC.getUTCDate(),
      nowUTC.getUTCHours(),
      nowUTC.getUTCMinutes(),
      nowUTC.getUTCSeconds()
    );

    const inputTime = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );

    const diffMs = nowTime - inputTime;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec} sec ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs} hrs ago`;

    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} days ago`;
  }
}

export default ManageTIME;
