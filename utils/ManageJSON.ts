////// Importa módulos del sistema de archivos y rutas 
import fs from 'fs';
import path from 'path';

/**
 * ///////////////////////////// ManageJSON //////////////////////////////////
 * 
 * Clase de utilidades para manipular archivos **JSON** de forma sencilla.
 * 
 * Funcionalidades principales:
 * - Leer y escribir archivos JSON desde una ruta base.
 * - Insertar, actualizar y fusionar objetos dentro de un JSON.
 * - Manejar tanto **objetos** como **arreglos**.
 * - Insertar elementos al inicio o final de un array.
 * - Reemplazar el contenido completo de un archivo JSON.
 * - Verificar si un archivo o clave existe.
 * - Crear archivos vacíos automáticamente si es necesario.
 * 
 * Uso típico:
 * ```ts
 * import ManageJSON from './ManageJSON';
 * 
 * const storage = new ManageJSON('./src/storage/data/');
 * 
 * // Crear archivo vacío
 * storage.createEmptyJSON('usuarios');
 * 
 * // Insertar objeto dentro de un JSON
 * storage.upsertObject('usuarios', 'u001', { nombre: 'Ana', edad: 25 });
 * 
 * // Obtener un objeto específico
 * const user = storage.getObjectByKey('usuarios', 'u001');
 * console.log(user); // { nombre: "Ana", edad: 25 }
 * 
 * // Fusionar sub-objetos
 * storage.mergeIntoObject('usuarios', 'u001', { direccion: { ciudad: 'Córdoba' } });
 * 
 * // Insertar en lista
 * storage.insertAtTop('logs', { evento: 'Inicio de sesión', fecha: Date.now() });
 * ```
 * 
 * Notas:
 * - Todos los métodos gestionan automáticamente la extensión `.json`.
 * - Se manejan errores internamente con `try/catch` y logs en consola.
 * - Ideal para proyectos Node.js que necesiten almacenamiento sencillo en JSON.
 * 
 * ///////////////////////////////////////////////////////////////////////////
 */

class ManageJSON {
    /** Ruta base donde se encuentran los archivos JSON */
    public basePath: string;

    /**
     * @param {string} basePath - Ruta base (por defecto "./assets/temps/")
     */
    constructor(basePath: string = "./src/storage/data/") {
        this.basePath = basePath;
    }

    /**
     * Inserta o actualiza una propiedad dentro de un objeto anidado en el JSON.
     * Si la propiedad ya existe, se fusiona sin eliminar el contenido anterior.
     * Ejemplo: { "UP": { contrato: { a: 1 } } } + { contrato: { b: 2 } } =>
     *          { "UP": { contrato: { a: 1, b: 2 } } }
     * 
     * @param {string} fileName - Nombre del archivo
     * @param {string} key - Clave principal (nivel 1)
     * @param {Record<string, any>} newSubObject - Subobjeto a fusionar dentro del objeto existente
     */
    mergeIntoObject(fileName: string, key: string, newSubObject: Record<string, any>): void {
        try {
            const json = this.readContent(fileName);

            if (!json[key]) {
                json[key] = {};
            }

            for (const [subKey, value] of Object.entries(newSubObject)) {
                if (typeof json[key][subKey] === 'object' && typeof value === 'object') {
                    json[key][subKey] = {
                        ...json[key][subKey],
                        ...value
                    };
                } else {
                    json[key][subKey] = value;
                }
            }

            this.saveJSON(fileName, json);
            console.log(`[ManageJSON] mergeIntoObject: Clave "${key}" actualizada/creada correctamente.`);
        } catch (error) {
            console.error(`[ManageJSON] [mergeIntoObject] Error al insertar/fusionar datos en ${fileName}:`, error);
        }
    }


    /**
     * Busca un objeto dentro de un archivo JSON, y actualiza una propiedad específica si existe
     * @param {string} fileName - Nombre del archivo JSON
     * @param {string} objectKey - Clave del objeto a buscar dentro del JSON
     * @param {string} propertyKey - Clave de la propiedad que se desea modificar
     * @param {any} newValue - Nuevo valor a asignar a la propiedad
     * @returns {boolean} - `true` si se encontró y modificó la propiedad, `false` si no se encontró
     */
    updatePropertyInObject(fileName: string, objectKey: string, propertyKey: string, newValue: any): boolean {
        try {
            const json = this.readContent(fileName);

            if (!json || typeof json !== 'object') {
                console.error(`[ManageJSON] [updatePropertyInObject] El archivo no contiene un objeto válido.`);
                return false;
            }

            if (!json.hasOwnProperty(objectKey)) {
                console.warn(`[ManageJSON] El objeto "${objectKey}" no existe en ${fileName}.`);
                return false;
            }

            const targetObject = json[objectKey];

            if (!targetObject || typeof targetObject !== 'object') {
                console.warn(`[ManageJSON] El valor asociado a "${objectKey}" no es un objeto.`);
                return false;
            }

            if (!targetObject.hasOwnProperty(propertyKey)) {
                console.warn(`[ManageJSON] La propiedad "${propertyKey}" no existe dentro del objeto "${objectKey}".`);
                return false;
            }

            targetObject[propertyKey] = newValue;
            this.saveJSON(fileName, json);

            console.log(`[ManageJSON] Propiedad "${propertyKey}" de "${objectKey}" actualizada correctamente.`);
            return true;
        } catch (error) {
            console.error(`[ManageJSON] [updatePropertyInObject] Error al actualizar propiedad "${propertyKey}":`, error);
            return false;
        }
    }

    /**
     * Obtiene un objeto específico por clave desde un archivo JSON
     * @param {string} fileName - Nombre del archivo
     * @param {string} key - Clave del objeto a obtener
     * @returns {any | null} - Objeto encontrado o `null` si no existe
     */
    getObjectByKey(fileName: string, key: string): any | null {
        try {
            const json = this.readContent(fileName);
            if (Object.prototype.hasOwnProperty.call(json, key)) {
                return json[key];
            } else {
                return null;
            }
        } catch (error) {
            console.error(`[ManageJSON] [getObjectByKey] Error al obtener la clave "${key}" de ${fileName}:`, error);
            return null;
        }
    }

    /**
     * Lee el contenido bruto de un archivo JSON desde la basePath
     * @param {string} fileName - Nombre del archivo JSON (con o sin .json)
     * @returns {any} - Contenido del archivo JSON como objeto manipulable
     */
    readContent(fileName: string): any {
        try {
            const filePath = this.getFilePath(fileName);
            if (!fs.existsSync(filePath)) {
                throw new Error(`El archivo no existe: ${filePath}`);
            }
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw || '{}');
        } catch (error) {
            console.error(`[ManageJSON] [readContent] Error al leer ${fileName}:`, error);
            return null;
        }
    }

    /**
     * Guarda un objeto sobrescribiendo todo el archivo JSON
     * @param {string} fileName - Nombre del archivo
     * @param {Record<string, any> | any[]} data - Contenido a guardar
     * @returns {void}
     */
    saveJSON(fileName: string, data: Record<string, any> | any[]): void {
        try {
            if (typeof data !== 'object' || data === null) {
                throw new TypeError('[ManageJSON] [saveJSON] Los datos deben ser un objeto o un arreglo válido.');
            }

            const filePath = this.getFilePath(fileName);
            const jsonString = JSON.stringify(data, null, 2);

            fs.writeFileSync(filePath, jsonString, 'utf8');

            console.log(`[ManageJSON] [saveJSON] Archivo guardado exitosamente en ${filePath}`);
        } catch (error) {
            console.error(`[ManageJSON] [saveJSON] Error al guardar ${fileName}:`, error);
        }
    }

    /**
     * Verifica si un objeto con una clave específica existe en el JSON
     * @param {string} fileName - Nombre del archivo
     * @param {string} key - Clave a buscar en el objeto
     * @returns {boolean} - `true` si existe, `false` si no
     */
    hasObject(fileName: string, key: string): boolean {
        try {
            const json = this.readContent(fileName);
            return Object.prototype.hasOwnProperty.call(json, key);
        } catch (error) {
            console.error(`[ManageJSON] [hasObject] Error al buscar clave "${key}" en ${fileName}:`, error);
            return false;
        }
    }

    /**
     * Inserta o actualiza un objeto por clave dentro del JSON
     * @param {string} fileName - Nombre del archivo
     * @param {string} key - Clave que se va a insertar o actualizar
     * @param {Record<string, any>} newObject - Objeto con los datos a guardar
     * @returns {void}
     */
    upsertObject(fileName: string, key: string, newObject: Record<string, any>): void {
        try {
            const json = this.readContent(fileName);
            json[key] = newObject;
            this.saveJSON(fileName, json);
        } catch (error) {
            console.error(`[ManageJSON] [upsertObject] Error al insertar/actualizar ${key} en ${fileName}:`, error);
        }
    }

    /**
     * Inserta un objeto al inicio del arreglo del JSON (orden descendente)
     * @param {string} fileName - Nombre del archivo
     * @param {Record<string, any>} newObject - Objeto a insertar
     * @returns {void}
     */
    insertAtTop(fileName: string, newObject: Record<string, any>): void {
        try {
            if (typeof newObject !== "object" || newObject === null) {
                console.log("[ManageJSON] No se ha pasado un objeto válido para asignar.");
                return;
            }

            const filePath = this.getFilePath(fileName);
            let array: Record<string, any>[] = [];

            if (this.fileExists(fileName)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    array = parsed;
                }
            }

            array.unshift(newObject);
            this.saveJSON(fileName, array);
        } catch (error) {
            console.error(`[ManageJSON] [insertAtTop] Error al insertar en ${fileName}:`, error);
        }
    }

    /**
     * Inserta un objeto al final del arreglo del JSON (orden ascendente)
     * @param {string} fileName - Nombre del archivo
     * @param {Record<string, any>} newObject - Objeto a insertar
     * @returns {void}
     */
    insertAtBottom(fileName: string, newObject: Record<string, any>): void {
        try {
            if (typeof newObject !== "object" || newObject === null) {
                console.log("[ManageJSON] No se ha pasado un objeto válido para insertar.");
                return;
            }

            const filePath = this.getFilePath(fileName);
            let array: Record<string, any>[] = [];

            if (this.fileExists(fileName)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    array = parsed;
                }
            }

            array.push(newObject);
            this.saveJSON(fileName, array);
        } catch (error) {
            console.error(`[ManageJSON] [insertAtBottom] Error al insertar en ${fileName}:`, error);
        }
    }

    /**
     * Borra todo el contenido de un archivo JSON y escribe nueva información
     * @param {string} fileName - Nombre del archivo
     * @param {Record<string, any> | any[]} newContent - Contenido que reemplazará al anterior
     * @returns {void}
     */
    replaceContent(fileName: string, newContent: Record<string, any> | any[]): void {
        try {
            this.saveJSON(fileName, newContent);
        } catch (error) {
            console.error(`[ManageJSON] [replaceContent] Error al reemplazar contenido en ${fileName}:`, error);
        }
    }

    /**
 * Construye la ruta completa de un archivo JSON
 * @param {string} fileName - Nombre del archivo (con o sin extensión .json)
 * @returns {string} - Ruta absoluta del archivo
 */
    getFilePath(fileName: string): string {
        try {
            return path.join(this.basePath, fileName.endsWith('.json') ? fileName : `${fileName}.json`);
        } catch (error) {
            console.error(`[ManageJSON] [getFilePath] Error al construir ruta de ${fileName}:`, error);
            return '';
        }
    }

    /**
     * Verifica si el archivo JSON existe en la ruta base
     * @param {string} fileName - Nombre del archivo
     * @returns {boolean} - `true` si el archivo existe, `false` si no
     */
    fileExists(fileName: string): boolean {
        try {
            return fs.existsSync(this.getFilePath(fileName));
        } catch (error) {
            console.error(`[ManageJSON] [fileExists] Error al verificar existencia de ${fileName}:`, error);
            return false;
        }
    }

    /**
     * Crea un archivo JSON vacío si no existe
     * @param {string} fileName - Nombre del archivo JSON a crear
     * @returns {void}
     */
    createEmptyJSON(fileName: string): void {
        try {
            const filePath = this.getFilePath(fileName);
            if (!this.fileExists(fileName)) {
                fs.writeFileSync(filePath, '{}', 'utf8');
            }
        } catch (error) {
            console.error(`[ManageJSON] [createEmptyJSON] Error al crear archivo vacío ${fileName}:`, error);
        }
    }
}

export default ManageJSON;
