import { EventEmitter } from 'events';

/**
 * ---------------------------- ProxyManager --------------------------------
 * 
 * Clase para gestionar proxies con:
 * - Control de máximo de solicitudes concurrentes por proxy
 * - Rotación round-robin de puertos
 * - Bloqueo temporal (cooldown) tras fallos consecutivos
 * - Auto-liberación de proxies tras timeout
 * 
 * Uso típico:
 * ```ts
 * const proxyManager = new ProxyManager(proxyConfigs, 10);
 * 
 * // Adquirir un proxy
 * const { proxy, index } = await proxyManager.acquire();
 * console.log(proxy.host, proxy.port);
 * 
 * // Reportar fallo si hubo problema
 * proxyManager.reportFailure(index);
 * 
 * // Liberar manualmente si terminaste
 * proxyManager.release(index);
 * ```
 * --------------------------------------------------------------------------
 */

/**
 * Configuración base de un proxy
 */
interface ProxyConfig {
  host: string;
  ports: number[];      // Lista de puertos disponibles para rotación
  username: string;
  password: string;
}

/**
 * Estado interno de un proxy durante su uso
 */
interface ProxyState extends ProxyConfig {
  current: number;
  portIndex: number;
  port: number;
}

/**
 * Proxy adquirido para uso temporal
 */
interface AcquiredProxy {
  proxy: ProxyState;
  index: number;
}


class ProxyManager extends EventEmitter {
  private proxies: ProxyState[];
  private maxRequests: number;
  private lockedIndexes = new Set<number>();
  private failureCount = new Map<number, number>();
  private cooldownUntil = new Map<number, number>();

  /**
   * Constructor
   * @param proxies Lista de proxies configurados
   * @param maxRequests Máximo de solicitudes concurrentes permitidas por proxy
   */
  constructor(proxies: ProxyConfig[], maxRequests: number) {
    super();
    this.proxies = proxies.map(p => ({
      ...p,
      current: 0,
      portIndex: 0,
      port: p.ports[0]
    }));
    this.maxRequests = maxRequests;
  }

  /**
   * Comprueba si un proxy está en cooldown
   * @param index Índice del proxy
   * @returns true si el proxy está en cooldown
   */
  private isOnCooldown(index: number): boolean {
    const until = this.cooldownUntil.get(index);
    return !!until && Date.now() < until;
  }

  /**
   * Adquiere un proxy disponible respetando:
   * - MaxRequests por proxy
   * - Exclusiones
   * - Cooldown
   * 
   * Rotación round-robin de puertos incluida.
   * @param excludeIndexes Array de índices de proxies a excluir
   * @returns Proxy disponible y su índice
   */
  public async acquire(excludeIndexes: number[] = []): Promise<AcquiredProxy> {
    while (true) {
      const idx = this.proxies.findIndex((p, i) =>
        p.current < this.maxRequests &&
        !excludeIndexes.includes(i) &&
        !this.lockedIndexes.has(i) &&
        !this.isOnCooldown(i)
      );

      if (idx !== -1) {
        this.lockedIndexes.add(idx);
        const state = this.proxies[idx];
        state.current++;

        // Rotación round-robin de puertos
        state.portIndex = (state.portIndex + 1) % state.ports.length;
        state.port = state.ports[state.portIndex];

        // Auto-liberación tras 11s por seguridad
        setTimeout(() => this.release(idx), 11000);

        return { proxy: state, index: idx };
      }

      // Espera a que algún proxy sea liberado
      await new Promise(res => this.once('released', res));
    }
  }

  /**
   * Libera un proxy previamente adquirido
   * @param index Índice del proxy a liberar
   */
  public release(index: number): void {
    const state = this.proxies[index];
    if (state.current > 0) state.current--;
    this.lockedIndexes.delete(index);
    this.emit('released');
  }

  /**
   * Reporta un fallo en un proxy
   * @param index Índice del proxy
   * Si se exceden 3 fallos consecutivos, se activa cooldown de 10s
   */
  public reportFailure(index: number): void {
    const count = (this.failureCount.get(index) || 0) + 1;
    this.failureCount.set(index, count);

    if (count >= 3) {
      this.cooldownUntil.set(index, Date.now() + 10000);
      console.warn(`🚫 Proxy ${index} en cooldown por fallos.`);
    }
  }

  /**
   * Reinicia el conteo de fallos de un proxy
   * @param index Índice del proxy
   */
  public resetFailures(index: number): void {
    this.failureCount.set(index, 0);
  }

  /**
   * Retorna un resumen del estado actual de todos los proxies
   */
  public getStatus(): ProxyState[] {
    return this.proxies.map(p => ({ ...p }));
  }
}

export { ProxyManager, ProxyConfig, ProxyState, AcquiredProxy };
