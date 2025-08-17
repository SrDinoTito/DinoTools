/**
 * ---------------------------- RequestManager ----------------------------
 * 
 * Clase para gestionar solicitudes a APIs respetando límites de velocidad (rate limiting).
 * Permite registrar varias APIs con diferentes límites y asegura que las solicitudes
 * que exceden el límite se pongan en cola hasta poder ejecutarse.
 * 
 * Funciona con callbacks asíncronos (`async`) y mantiene un registro de timestamps
 * de las solicitudes recientes para cada API.
 * 
 * ------------------------------------------------------------------------
 */

type APILimit = {
  maxRequests: number;
  windowMs: number;
  requests: number[];
  queue: Array<() => void>;
};

type AsyncCallback<T> = () => Promise<T>;

class RequestManager {
  /** Objeto que almacena la configuración y estado de cada API registrada */
  private limits: Record<string, APILimit> = {};

  /**
   * Registra una API con su límite de solicitudes.
   * @param apiKey - Identificador único de la API
   * @param maxRequests - Número máximo de solicitudes por ventana de tiempo
   * @param windowMs - Ventana de tiempo en milisegundos para el límite
   */
  registerAPI(apiKey: string, maxRequests: number, windowMs: number) {
    this.limits[apiKey] = {
      maxRequests,
      windowMs,
      requests: [],
      queue: [],
    };
  }

  /**
   * Ejecuta un callback asíncrono respetando el límite de la API.
   * Si el límite se excede, la solicitud se pone en cola hasta que pueda ejecutarse.
   * @param apiKey - Identificador de la API registrada
   * @param callback - Función asíncrona que realiza la solicitud
   * @returns Una promesa que se resuelve con el valor devuelto por el callback
   * @throws Error si la API no está registrada
   */
  async request<T>(apiKey: string, callback: AsyncCallback<T>): Promise<T> {
    const limit = this.limits[apiKey];
    if (!limit) throw new Error(`API "${apiKey}" no registrada`);

    return new Promise<T>((resolve, reject) => {
      const tryExecute = async () => {
        const now = Date.now();

        // Filtra las solicitudes viejas que ya están fuera de la ventana
        limit.requests = limit.requests.filter(ts => now - ts < limit.windowMs);

        if (limit.requests.length < limit.maxRequests) {
          // Se puede ejecutar: registrar timestamp y correr el callback
          limit.requests.push(now);
          try {
            const result = await callback();
            resolve(result);
          } catch (err) {
            reject(err);
          }

          // Ejecutar siguiente callback en la cola, si existe
          if (limit.queue.length > 0) {
            const next = limit.queue.shift()!;
            next();
          }
        } else {
          // Se excedió el límite → esperar hasta que se libere espacio
          const waitTime = limit.windowMs - (now - limit.requests[0]);
          console.warn(`[RateLimit] ${apiKey} → esperando ${waitTime}ms`);
          setTimeout(() => tryExecute(), waitTime);
        }
      };

      // Añadir a la cola
      limit.queue.push(tryExecute);

      // Si esta era la única en la cola, ejecutar de inmediato
      if (limit.queue.length === 1) tryExecute();
    });
  }
}

export default RequestManager;