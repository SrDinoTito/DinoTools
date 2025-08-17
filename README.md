# ManageJSON

**ManageJSON** es una clase de utilidades para manejar archivos **JSON** de forma sencilla en **Node.js**.  
Ideal para almacenar datos locales sin necesidad de una base de datos compleja.  

---

## Características

- Leer y escribir archivos JSON desde una ruta base.
- Insertar, actualizar y fusionar objetos dentro de un JSON.
- Manejar tanto **objetos** como **arreglos**.
- Insertar elementos al inicio o final de un array.
- Reemplazar el contenido completo de un archivo JSON.
- Verificar si un archivo o clave existe.
- Crear archivos vacíos automáticamente si es necesario.
- Manejo de errores con logs en consola.

---

## Uso

```ts
import ManageJSON from './ManageJSON';

// Crear una instancia apuntando a la carpeta de almacenamiento
const storage = new ManageJSON('./src/storage/data/');

// Crear un archivo JSON vacío si no existe
storage.createEmptyJSON('usuarios');

// Insertar o actualizar un objeto
storage.upsertObject('usuarios', 'u001', { nombre: 'Ana', edad: 25 });

// Obtener un objeto por clave
const user = storage.getObjectByKey('usuarios', 'u001');
console.log(user); // { nombre: "Ana", edad: 25 }

// Fusionar sub-objetos
storage.mergeIntoObject('usuarios', 'u001', { direccion: { ciudad: 'Córdoba' } });

// Actualizar una propiedad específica
storage.updatePropertyInObject('usuarios', 'u001', 'edad', 26);

// Insertar un objeto al inicio de un array
storage.insertAtTop('logs', { evento: 'Inicio de sesión', fecha: Date.now() });

// Insertar un objeto al final de un array
storage.insertAtBottom('logs', { evento: 'Cierre de sesión', fecha: Date.now() });

// Reemplazar todo el contenido de un archivo JSON
storage.replaceContent('usuarios', { u002: { nombre: 'Luis', edad: 30 } });

// Verificar si existe un objeto por clave
console.log(storage.hasObject('usuarios', 'u002')); // true

// Leer el contenido de un JSON directamente
console.log(storage.readContent('usuarios'));
```

----

# ManageLogs

**ManageLogs** es una clase para gestionar logs de manera sencilla en **Node.js**.  
Permite registrar mensajes con distintos niveles de severidad y guarda automáticamente los archivos de log en la ruta especificada.  

---

## Características

- Crea automáticamente la carpeta y el archivo de logs si no existen.
- Permite registrar mensajes con niveles: `INFO`, `WARN`, `ERROR`, `DEBUG`, `NOTE`.
- Formatea cada entrada con marca de tiempo en formato ISO 8601.
- Registro sencillo y seguro usando Node.js.

---

## Uso

```ts
import ManageLogs from './ManageLogs';

// Crear una instancia de ManageLogs
// La ruta es opcional, por defecto se guarda en './src/monitoring.log'
const logger = new ManageLogs('./logs/');

// Registrar mensajes con distintos niveles
logger.log('INFO', 'Aplicación iniciada');
logger.log('DEBUG', 'Configuración cargada correctamente');
logger.log('WARN', 'Memoria disponible baja');
logger.log('ERROR', 'No se pudo conectar a la base de datos');
logger.log('NOTE', 'Proceso finalizado correctamente');

// Cada entrada se guarda con formato:
// [YYYY-MM-DDTHH:mm:ss.sssZ] LEVEL - Mensaje
```

---

# RequestManager

**RequestManager** es una clase para gestionar solicitudes a APIs respetando límites de velocidad (rate limiting).  
Permite registrar múltiples APIs con diferentes límites y asegura que las solicitudes que exceden el límite se pongan en cola hasta poder ejecutarse.

Funciona con callbacks asíncronos (`async`) y mantiene un registro de timestamps de las solicitudes recientes para cada API.

---

## Características

- Registro de múltiples APIs con distintos límites de solicitudes por ventana de tiempo.
- Controla automáticamente la cantidad de requests para no superar el límite.
- Si se excede el límite, las solicitudes se ponen en cola y se ejecutan cuando sea posible.
- Maneja funciones asíncronas (`async/await`) de manera transparente.
- Logs de advertencia en consola cuando se debe esperar por rate limiting.

---

## Uso

```ts
import RequestManager from './RequestManager';

const manager = new RequestManager();

// Registrar APIs con límite
// Por ejemplo: apiKey 'weatherAPI', máximo 5 requests cada 10 segundos (10000 ms)
manager.registerAPI('weatherAPI', 5, 10000);
manager.registerAPI('stockAPI', 2, 5000);

// Función asíncrona de ejemplo que simula una llamada a API
const fetchWeather = async () => {
  return 'Clima soleado';
};

// Ejecutar solicitudes respetando límites
async function main() {
  const results = await Promise.all([
    manager.request('weatherAPI', fetchWeather),
    manager.request('weatherAPI', fetchWeather),
    manager.request('weatherAPI', fetchWeather),
  ]);

  console.log(results); // ['Clima soleado', 'Clima soleado', 'Clima soleado']
}

main();
```

---

# UserAgentManager

**UserAgentManager** es una clase para gestionar un conjunto de **User-Agents** con control de uso concurrente.  
Es útil en scrapers, bots o automatizaciones donde se quiere:

- Rotar user-agents automáticamente.
- Evitar que un mismo user-agent exceda un número máximo de usos simultáneos.
- Esperar hasta que haya un user-agent disponible si todos están ocupados.

---

## Características

- Manejo de lista de user-agents configurables.
- Control del número máximo de usos simultáneos por user-agent.
- Adquisición de user-agents disponibles con promesas asíncronas (`async/await`).
- Liberación automática y reasignación de user-agents cuando están disponibles.
- Selección aleatoria para evitar sesgos en el uso de user-agents.
- Logs en consola de user-agents seleccionados y advertencias si se libera uno que no estaba en uso.

---

## Uso

```ts
import { UserAgentManager } from './UserAgentManager';

async function main() {
  // Crear un gestor con 3 user-agents, máximo 2 usos concurrentes por UA
  const manager = new UserAgentManager(['UA1', 'UA2', 'UA3'], 2);

  // Adquirir un user-agent disponible
  const ua = await manager.acquire();
  console.log("Usando:", ua);

  // Simular uso del UA
  setTimeout(() => {
    // Liberar el user-agent después de usarlo
    manager.release(ua);
    console.log("Liberado:", ua);
  }, 2000);
}

main();
```

---

# ManageTIME

**ManageTIME** es una clase para calcular la diferencia de tiempo entre una fecha dada y la fecha actual, devolviendo un string en formato “time ago” (hace X tiempo).  
Soporta entradas como `Date`, `string` o `number`.

---

## Características

- Convierte timestamps, objetos `Date` o strings parseables a un formato legible.
- Devuelve el tiempo transcurrido de forma intuitiva:
  - Menos de 1 minuto → `"X sec ago"`
  - Menos de 1 hora → `"X min ago"`
  - Menos de 1 día → `"X hrs ago"`
  - Más de 1 día → `"X days ago"`
  - Fecha inválida → `"Fecha inválida"`
- Fácil de integrar en cualquier proyecto Node.js o frontend.

---

## Uso

```ts
import ManageTIME from './ManageTIME';

const mt = new ManageTIME();

// Con objeto Date
console.log(mt.getTimeAgo(new Date())); // "0 sec ago"

// Con timestamp en milisegundos
console.log(mt.getTimeAgo(Date.now() - 60000)); // "1 min ago"

// Con string ISO
console.log(mt.getTimeAgo("2025-08-17T12:00:00Z")); // "X days ago"
```
---

# ProxyManager

**ProxyManager** es una clase para gestionar proxies de forma avanzada en **Node.js**, ideal para scrapers, bots o cualquier aplicación que necesite:

- Rotar proxies automáticamente.
- Limitar el número de solicitudes concurrentes por proxy.
- Poner en cooldown proxies que fallen varias veces consecutivas.
- Rotar puertos de manera **round-robin**.
- Liberar automáticamente proxies después de un timeout para evitar bloqueos.

---

## Características

- Adquiere proxies disponibles respetando un máximo de solicitudes concurrentes.
- Rotación de puertos **round-robin** por proxy.
- Bloqueo temporal (cooldown) de proxies con fallos repetidos.
- Auto-liberación de proxies tras timeout configurable.
- Permite excluir ciertos proxies de la adquisición temporalmente.
- Mantiene un registro interno del estado de cada proxy (conexiones activas, puerto actual, etc.).
- Emite eventos al liberar proxies para permitir gestión asíncrona.
- Método opcional para inspeccionar el estado actual de todos los proxies.

---

## Uso

```ts
import { ProxyManager, ProxyConfig } from './ProxyManager';

// Definir configuración de proxies
const proxyConfigs: ProxyConfig[] = [
  {
    host: "176.105.228.172",
    ports: [12323, 12324, 12325],
    username: "usuario1",
    password: "pass1"
  },
  {
    host: "140.99.118.220",
    ports: [11323, 11324],
    username: "usuario2",
    password: "pass2"
  }
];

// Crear instancia del manager con máximo 5 solicitudes concurrentes por proxy
const proxyManager = new ProxyManager(proxyConfigs, 5);

(async () => {
  // Adquirir un proxy disponible
  const { proxy, index } = await proxyManager.acquire();
  console.log(`Usando proxy ${proxy.host}:${proxy.port}`);

  // Reportar fallo si hubo problema
  proxyManager.reportFailure(index);

  // Liberar el proxy cuando ya no se use
  proxyManager.release(index);

  // Consultar estado actual de todos los proxies
  console.log(proxyManager.getStatus());
})();
```
 
---