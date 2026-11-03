# UNDERCHAOS — Publicador local de medios

## Instalación
1. Descarga el repositorio `rodrodbeat-stack/UNDERCHAOS` desde GitHub.
2. Descomprime el repositorio en tu computador.
3. Reemplaza únicamente el archivo `app.js` original por el `app.js` incluido en este paquete.
4. Guarda los cambios y súbelos a GitHub (o reemplaza el archivo desde la web de GitHub).
5. Espera a que GitHub Pages publique los cambios y recarga la página.

## Uso
- Botón ▧: seleccionar una imagen.
- Botón ▣: seleccionar un vídeo.
- Botón ♫: seleccionar música o audio.
- Escribe una descripción y pulsa PUBLICAR.
- Los archivos se guardan en IndexedDB del navegador y reaparecen al volver a abrir la web en ese mismo navegador/dispositivo.

## Importante
Esta versión guarda las publicaciones localmente. No se comparten con otras personas ni con otros dispositivos. El navegador puede aplicar límites de almacenamiento y borrar datos si se limpian sus datos del sitio. El límite de 100 MB por archivo es una validación de la aplicación, no una garantía de espacio disponible.

Para publicación compartida entre usuarios/dispositivos conectaremos Supabase después. No pongas claves privadas ni `service_role` en el JavaScript del navegador.
