/**
 * ////////////////////////// UserAgentManager ///////////////////////////////
 * 
 * Clase para gestionar un conjunto de **User-Agents** con control de uso
 * concurrente. Útil en scrapers, bots o automatizaciones donde se quiere:
 * 
 * Rotar user-agents automáticamente.  
 * Evitar que un mismo user-agent exceda un número máximo de usos simultáneos.  
 * Esperar hasta que haya un user-agent disponible si todos están ocupados.  
 * 
 * --------------------------------------------------------------------------
 * 📂 Ejemplo de uso:
 * ```ts
 * import { UserAgentManager } from './UserAgentManager';
 * 
 * const manager = new UserAgentManager(
 *   ['UA1', 'UA2', 'UA3'], // lista de user-agents
 *   2                      // máximo 2 usos concurrentes por UA
 * );
 * 
 * // Adquirir un user-agent disponible
 * const ua = await manager.acquire();
 * console.log("Usando:", ua);
 * 
 * // Liberar el user-agent cuando ya no se use
 * manager.release(ua);
 * ```
 * --------------------------------------------------------------------------
 */
class UserAgentManager {
    private userAgents: string[];
    private maxConcurrentUses: number;
    private usageCount: Map<string, number>;
    private waiters: Array<(ua: string) => void>;

    /**
     * Crea una nueva instancia del gestor de user-agents
     * 
     * @param {string[]} userAgents - Lista de user-agents disponibles.
     * @param {number} [maxConcurrentUses=1] - Máximo de usos simultáneos permitidos por cada user-agent.
     */
    constructor(userAgents: string[], maxConcurrentUses = 1) {
        this.userAgents = userAgents;
        this.maxConcurrentUses = maxConcurrentUses;
        this.usageCount = new Map();
        this.waiters = [];

        for (const ua of userAgents) {
            this.usageCount.set(ua, 0);
        }
    }

    /**
     * Adquiere un user-agent disponible.
     * 
     * - Si hay user-agents libres (uso concurrente < límite), devuelve uno inmediatamente.
     * - Si todos están ocupados, devuelve una promesa que se resuelve
     *   cuando alguno se libere.
     * 
     * @returns {Promise<string>} Un user-agent disponible.
     */
    public async acquire(): Promise<string> {
        const availableUA = this.getAvailableUserAgent();
        if (availableUA) {
            this.incrementUsage(availableUA);
            return availableUA;
        }

        return new Promise<string>((resolve) => {
            this.waiters.push(resolve);
        });
    }

    /**
     * Libera un user-agent previamente adquirido.
     * 
     * - Reduce en 1 su contador de uso.
     * - Si hay procesos esperando (`waiters`), les asigna el user-agent liberado.
     * 
     * @param {string} userAgent - El user-agent a liberar.
     */
    public release(userAgent: string) {
        const current = this.usageCount.get(userAgent) ?? 0;
        if (current > 0) {
            this.usageCount.set(userAgent, current - 1);

            if (this.waiters.length > 0) {
                const waiter = this.waiters.shift()!;
                this.incrementUsage(userAgent);
                waiter(userAgent);
            }
        } else {
            console.warn(`[UserAgentManager] Se intentó liberar un user-agent que no estaba en uso: ${userAgent}`);
        }
    }

    /**
     * Busca un user-agent con menos de `maxConcurrentUses`.
     * Los user-agents se barajan para evitar sesgos.
     * 
     * @returns {string | null} Un user-agent libre o `null` si todos están ocupados.
     * @private
     */
    private getAvailableUserAgent(): string | null {
        const shuffled = [...this.userAgents].sort(() => Math.random() - 0.5);

        for (const ua of shuffled) {
            if ((this.usageCount.get(ua) ?? 0) < this.maxConcurrentUses) {
                console.log(`[UserAgentManager] Seleccionado: ${ua}`);
                return ua;
            }
        }
        return null;
    }

    /**
     * Incrementa el contador de uso de un user-agent.
     * 
     * @param {string} userAgent - El user-agent al que se le suma 1 en el uso.
     * @private
     */
    private incrementUsage(userAgent: string) {
        const current = this.usageCount.get(userAgent) ?? 0;
        this.usageCount.set(userAgent, current + 1);
    }
}

export { UserAgentManager };