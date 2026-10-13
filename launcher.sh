#!/bin/bash
# Launcher script - Inicia el servidor web local y abre el navegador automáticamente
# No requiere instalar Node ni paquetes de npm: utiliza Python 3 preinstalado en el sistema.

# Obtener el directorio del script (raíz del proyecto)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

PORT=${PORT:-8000}
PID_FILE="/tmp/solucion-hotelera.pid"
LOG_FILE="/tmp/solucion-hotelera.log"

# Función portable para verificar si el puerto está en uso
is_port_in_use() {
    if command -v python3 > /dev/null 2>&1; then
        python3 -c "import socket; s = socket.socket(); s.settimeout(0.5); exit(0 if s.connect_ex(('127.0.0.1', $1)) == 0 else 1)" 2>/dev/null
        return $?
    elif command -v lsof > /dev/null 2>&1; then
        lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
        return $?
    fi
    return 1
}

if is_port_in_use "$PORT"; then
    echo "⚠️  El servidor ya está corriendo en el puerto $PORT"
    echo "🌐 Abriendo navegador..."
else
    echo "🚀 Iniciando Solución Hotelera..."
    echo "📂 Directorio: $SCRIPT_DIR"
    echo "🌐 Servidor en: http://localhost:$PORT"
    echo ""

    if command -v python3 > /dev/null 2>&1; then
        python3 -m http.server "$PORT" > "$LOG_FILE" 2>&1 &
        SERVER_PID=$!
        echo "$SERVER_PID" > "$PID_FILE"
        echo "✅ Servidor iniciado con Python 3 (PID: $SERVER_PID)"
    elif command -v node > /dev/null 2>&1 && [ -f "scripts/serve.js" ]; then
        PORT="$PORT" node scripts/serve.js > "$LOG_FILE" 2>&1 &
        SERVER_PID=$!
        echo "$SERVER_PID" > "$PID_FILE"
        echo "✅ Servidor iniciado con Node (PID: $SERVER_PID)"
    else
        echo "❌ No se encontró Python 3 ni Node.js para iniciar el servidor HTTP."
        echo "Por favor asegúrate de tener python3 instalado en el sistema."
        exit 1
    fi

    echo "📝 Log: $LOG_FILE"
    echo ""
    sleep 1
fi

echo "🌐 Abriendo navegador en index.html..."

URL="http://localhost:$PORT/index.html"

if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "$URL" 2>/dev/null
elif command -v gnome-open > /dev/null 2>&1; then
    gnome-open "$URL" 2>/dev/null
elif command -v google-chrome > /dev/null 2>&1; then
    google-chrome "$URL" 2>/dev/null &
elif command -v firefox > /dev/null 2>&1; then
    firefox "$URL" 2>/dev/null &
elif command -v chromium-browser > /dev/null 2>&1; then
    chromium-browser "$URL" 2>/dev/null &
else
    echo "ℹ️  No se detectó un comando para abrir el navegador automáticamente."
    echo "Por favor abre en tu navegador: $URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Solución Hotelera está lista"
echo ""
echo "📄 Páginas disponibles:"
echo "   • Menú Principal:        http://localhost:$PORT/index.html"
echo "   • Reservas:              http://localhost:$PORT/client/reservations.html"
echo "   • Vouchers Grupales:     http://localhost:$PORT/client/groupMealVouchers.html"
echo "   • Ficha PAX:             http://localhost:$PORT/client/fichaPax.html"
echo "   • Voucher Individual:    http://localhost:$PORT/client/mealVoucher.html"
echo "   • Balneario:             http://localhost:$PORT/client/balnearioVoucher.html"
echo ""
echo "⏹️  Para detener el servidor ejecuta: ./stop-server.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
