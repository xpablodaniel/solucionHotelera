#!/bin/bash
# Instalador de acceso directo para Ubuntu nativo
# Crea el lanzador de escritorio y acceso en el menú de aplicaciones

echo "🚀 Instalación de acceso directo - Solución Hotelera"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar que NO sea WSL
if grep -qi microsoft /proc/version 2>/dev/null; then
    echo "⚠️  Nota: Estás ejecutando esto en WSL."
    echo "   En WSL puedes ejecutar directamente: ./launcher.sh"
    echo ""
fi

# Obtener directorio del proyecto
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DESKTOP_FILE="$PROJECT_DIR/Solucion-Hotelera.desktop"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Solución Hotelera
Comment=Herramientas para recepción y gestión hotelera
Exec=$PROJECT_DIR/launcher.sh
Path=$PROJECT_DIR
Icon=applications-internet
Terminal=false
Categories=Office;Utility;
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE"
chmod +x "$PROJECT_DIR/launcher.sh"
chmod +x "$PROJECT_DIR/stop-server.sh"

echo "✅ Archivo .desktop generado en el proyecto"

# Determinar ubicación del escritorio del usuario
DESKTOP_PATH="$HOME/Escritorio"
if [ ! -d "$DESKTOP_PATH" ]; then
    DESKTOP_PATH="$HOME/Desktop"
fi

if [ -d "$DESKTOP_PATH" ]; then
    cp "$DESKTOP_FILE" "$DESKTOP_PATH/"
    chmod +x "$DESKTOP_PATH/Solucion-Hotelera.desktop"
    if command -v gio >/dev/null 2>&1; then
        gio set "$DESKTOP_PATH/Solucion-Hotelera.desktop" metadata::trusted true 2>/dev/null || true
    fi
    echo "✅ Icono copiado en: $DESKTOP_PATH"
fi

# Instalar en el menú de aplicaciones del usuario
APPLICATIONS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPLICATIONS_DIR"
cp "$DESKTOP_FILE" "$APPLICATIONS_DIR/solucion-hotelera.desktop"
chmod +x "$APPLICATIONS_DIR/solucion-hotelera.desktop"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
fi

echo "✅ Acceso incorporado al menú de aplicaciones de Ubuntu"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Instalación lista:"
echo "   1. Doble clic en 'Solución Hotelera' en el escritorio"
echo "   2. Para iniciar por terminal: ./launcher.sh"
echo "   3. Para detener el servidor: ./stop-server.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
