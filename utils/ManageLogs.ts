import * as fs from 'fs';
import * as path from 'path';

/**
 * ///////////////////////////// ManageLogs //////////////////////////////////
 * Clase para gestionar logs de manera sencilla.
 *
 * - Crea automáticamente la carpeta y el archivo de logs si no existen.
 * - Permite registrar mensajes con distintos niveles de severidad.
 * - Formatea cada entrada con marca de tiempo en formato ISO 8601.
 *
 * Ejemplo de uso:
 * ```ts
 * const logger = new ManageLogs('./logs/') // Ruta opcional;
 * logger.log('INFO', 'Aplicación iniciada');
 * logger.log('ERROR', 'No se pudo conectar a la base de datos');
 * ```
 * ///////////////////////////////////////////////////////////////////////////
 */
class ManageLogs {
    private logPath: string;
    private logFile: string;

    /**
     * Constructor de la clase ManageLogs
     * @param {string} [folderPath='./src/'] - Ruta de la carpeta donde se almacenará el archivo de log.
     *                                          Si no existe, se creará automáticamente.
     */
    constructor(folderPath: string = './src/') {
        this.logPath = folderPath;
        this.logFile = path.join(this.logPath, 'monitoring.log');

        this.ensureLogFile();
    }

    /**
     * Verifica que la carpeta y el archivo de log existan.
     * Si no existen, los crea automáticamente.
     * @private
     */
    private ensureLogFile(): void {
        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, { recursive: true });
        }

        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, '', 'utf-8');
            console.log(`[LogManager] Archivo creado: ${this.logFile}`);
        }
    }

    /**
     * Agrega una entrada al archivo de log con un nivel y un mensaje.
     * Cada línea se guarda en formato:
     * `[YYYY-MM-DDTHH:mm:ss.sssZ] LEVEL - Mensaje`
     *
     * @param {'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'NOTE'} level - Nivel de log.
     * @param {string} message - Mensaje descriptivo a registrar.
     * 
     * @example
     * logger.log('INFO', 'Servidor iniciado en el puerto 3000');
     * logger.log('ERROR', 'Error al procesar la petición');
     */
    public log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'NOTE', message: string): void {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] ${level} - ${message}\n`;

        fs.appendFileSync(this.logFile, line, 'utf-8');
    }
}

export default ManageLogs;