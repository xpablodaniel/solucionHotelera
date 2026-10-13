#!/bin/bash
# Script para detener el servidor de Solución Hotelera

PID_FILE="/tmp/solucion-hotelera.pid"
LOG_FILE="/tmp/solucion-hotelera.log"
PORT=${PORT:-8000}

echo "⏹️  Deteniendo servidor Solución Hotelera..."

STOPPED=false

if [ -f "$PID_FILE" ]; then
    SERVER_PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$SERVER_PID" ] && ps -p "$SERVER_PID" > /dev/null 2>&1; then
        kill "$SERVER_PID" 2>/dev/null
        echo "✅ Servidor detenido (PID: $SERVER_PID)"
        STOPPED=true
    fi
    rm -f "$PID_FILE"
fi

if [ "$STOPPED" = false ]; then
    # Si no se encontró por PID, intentar buscar procesos usando el puerto si lsof está disponible
    if command -v lsof > /dev/null 2>&1; then
        PIDS=$(lsof -ti:$PORT 2>/dev/null)
        if [ -n "$PIDS" ]; then
            for PID in $PIDS; do
                kill "$PID" 2>/dev/null
                echo "✅ Proceso $PID detenido en el puerto $PORT"
                STOPPED=true
            done
        fi
    fi
fi

if [ "$STOPPED" = false ]; then
    echo "ℹ️  No había ningún servidor ejecutándose en el puerto $PORT"
fi

rm -f "$LOG_FILE"
echo "✅ Operación completada"
