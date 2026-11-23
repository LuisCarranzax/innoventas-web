# InnovVentas

Landing en React y Vite para el caso académico de asistencia de compra en una tienda de tecnología.

```sh
npm ci
npm run dev
```

Sin un endpoint configurado, el chat usa las respuestas locales de la demo. El catálogo reúne diez productos reales con fotos referenciales. Los precios en soles y la disponibilidad son simulados.

## Conectar el agente de Microsoft Foundry

Usa Node.js 22.12 o posterior. En Foundry, abre el agente de InnovVentas, verifica la versión activa y copia la URL **Responses** del menú **Publish**. La URL termina en `/agents/<agente>/endpoint/protocols/openai/responses`.

En PowerShell, desde la carpeta del proyecto:

```powershell
Copy-Item .env.example .env
notepad .env
```

Pega la URL a la derecha de `FOUNDRY_AGENT_RESPONSES_URL=` y guarda el archivo. La variable se lee en el servidor. El archivo `.env` está excluido de Git.

Para autenticarte en local, usa [Azure CLI](https://learn.microsoft.com/es-es/cli/azure/install-azure-cli-windows) con la cuenta que tiene acceso al agente. Si acabas de instalar la CLI, abre una terminal nueva antes de ejecutar estos comandos:

```powershell
az login
npm ci
npm run dev
```

Abre la URL que indique la terminal. En la burbuja inferior derecha, el chat mostrará **Microsoft Foundry** cuando el servidor tenga el endpoint configurado. Pulsa **Consultar** en la ficha del MacBook Pro 14″ (M4) y después pregunta «¿Cuánto cuesta?» para verificar la conexión y el contexto.

La web envía el contexto reciente a `POST /api/chat`. Node.js autentica la llamada con Microsoft Entra y adjunta los datos del catálogo que usa la web. Si Foundry devuelve un error, el chat muestra un mensaje y permite reintentar. Los códigos del servicio aparecen en la terminal del servidor.

- **401**. Vuelve a iniciar sesión con `az login` en el directorio de Azure del proyecto.
- **403**. Pide el rol **Foundry Agent Consumer** sobre el agente o comprueba que ya tienes **Foundry User** en el proyecto. [Permisos del endpoint](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/agent-endpoint-authorization)
- **404**. Comprueba que copiaste la URL **Responses** del agente y que su versión está activa. [Configuración del endpoint](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/configure-agent)

`npm run build` genera los archivos de React en `dist/`. Para servir esa versión junto con la API, usa `npm start`. En un alojamiento de Azure, configura la URL en el entorno del servidor y asigna a la identidad administrada el rol de consumidor del agente.

## Fotografías de stock

- Portada por [Zoshua Colah en Unsplash](https://unsplash.com/photos/a-dimly-lit-desk-with-a-laptop-and-monitor-IUKdnYUlDco).
- Laptop por [Mel Poole en Unsplash](https://unsplash.com/photos/macbook-pro-besides-white-book-nuFOLbZn6KA).
- Audífonos por [C D-X en Unsplash](https://unsplash.com/photos/flatlay-photography-of-wireless-headphones-PDX_a_82obo).
- Teclado por [JL Cabrera en Unsplash](https://unsplash.com/photos/a-black-keyboard-sitting-on-top-of-a-white-table-vbRWm4Qn-28).
- Mouse por [Krunal Lakhatariya en Unsplash](https://unsplash.com/photos/a-black-computer-mouse-on-a-white-desk--0Wqx50_W7g).
- Tablet por [cottonbro studio en Pexels](https://www.pexels.com/photo/white-ipad-on-white-table-3944392/).
- Foto de [unidades SSD en Unsplash](https://images.unsplash.com/photo-1721333084639-0f64b0583875).
- Monitor por [Teddy GR en Unsplash](https://unsplash.com/photos/a-computer-monitor-sitting-on-top-of-a-white-desk-gVpXbCGG6jI).
- [Cámara web en Unsplash](https://unsplash.com/photos/webcam-mounted-on-a-computer-monitor-screen-LaEOxuvzRnY).
- Parlante por [Bruchin Noeka en Pexels](https://www.pexels.com/photo/jbl-speaker-on-table-6011276/).
- Reloj por [Klim Musalimov en Unsplash](https://unsplash.com/photos/a-close-up-of-an-apple-watch-on-a-black-background-wnA994TTts4).

## Especificaciones de los productos

- [MacBook Pro 14″ (M4) · Apple](https://support.apple.com/en-za/121552)
- [WH-1000XM5 · Sony](https://www.sony.com/electronics/support/wireless-headphones-bluetooth-headphones/wh-1000xm5/specifications)
- [Tofu60 2.0 · KBDfans](https://kbdfans.com/products/tofu60-2-0)
- [MX Master 3S · Logitech](https://www.logitech.com/en-us/shop/p/mx-master-3s)
- [iPad 11″ (A16) · Apple](https://support.apple.com/es-lamr/122240)
- [Portable SSD T7 · Samsung](https://download.semiconductor.samsung.com/resources/data-sheet/Samsung_Portable_SSD_T7_Datasheet_Rev2.0.pdf)
- [UltraSharp U2723QE · Dell](https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/)
- [Brio 4K · Logitech](https://secure.logitech.com/en-us/shop/p/brio-4k.960-001390)
- [Flip 6 · JBL](https://support.jbl.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw6732ba6f/pdfs/JBL_Flip_6_SpecSheet_English.pdf)
- [Apple Watch Series 10 · Apple](https://support.apple.com/en-gb/121202)
