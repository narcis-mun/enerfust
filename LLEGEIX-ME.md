# Enerfust — Entrada d'albarans i factures (web-app)

Aquesta és la mateixa eina de sempre, però preparada per viure en un **servidor
propi d'Enerfust**. Així la lectura automàtica d'albarans **no depèn de Claude.ai**
i no falla amb "failed to fetch": la clau d'API viu al servidor i la crida es fa
des d'allà.

## Què hi ha a la carpeta

- `index.html` — l'aplicació (frontend). Tot el que ja teníeu: escaneig, casament
  albarà–factura, control de duplicats contra la base de costos, i exportació a Excel.
- `api/extract.js` — el backend. Rep les pàgines, hi posa la clau d'API (guardada al
  servidor) i crida el model. El navegador **mai** veu la clau.
- `LLEGEIX-ME.md` — aquest fitxer.

## Posar-la en marxa (per a qui gestiona la web/app d'Enerfust — una tarda)

Cal un compte a l'API d'Anthropic i penjar la carpeta a un host que executi
funcions (Vercel i Netlify tenen pla gratuït i van sense configuració extra).

1. **Clau d'API**: a https://console.anthropic.com creeu una API key d'Enerfust.
2. **Pengeu la carpeta** a Vercel o Netlify (arrossegant-la, o des del vostre Git).
3. **Configureu la variable d'entorn** al tauler del host:
   `ANTHROPIC_API_KEY = <la clau del pas 1>`
4. Desplegueu. Ja teniu una URL (p. ex. `enerfust.vercel.app`) que l'Alba obre al
   navegador o al mòbil. La lectura d'albarans ja funciona des d'allà, sempre.

> Nota tècnica: `api/extract.js` és una funció Node estàndard (`module.exports`)
> compatible amb Vercel i Netlify. Reenvia `{ system, contentBlocks }` a
> `api.anthropic.com` amb la capçalera `x-api-key` i torna la resposta tal qual;
> el frontend ja la sap interpretar. Model: `claude-sonnet-4-6`.

## Cost

Cada lectura és una crida a l'API (uns cèntims per document, segons pàgines).
Es factura al compte d'Anthropic d'Enerfust. La resta (Excel, base de costos,
casament) no té cap cost: passa tot al navegador.

## El que NO canvia

Tota la lògica de negoci és idèntica a la versió que ja teníeu. L'únic canvi és
que la lectura passa per `api/extract` (servidor propi) en lloc d'anar directament
a Claude.ai. Per això aquí no hi ha el problema de connexió del sandbox.
