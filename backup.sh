#!/bin/bash
# =============================================================
#  Script de backup para M&M Studio Web - TFG ASIR
#  Uso manual:    ./backup.sh
#  Automatizar:   añadir al crontab del sistema
#    0 2 * * *  /usr/local/bin/backup.sh   (cada día a las 2:00)
# =============================================================

FECHA=$(date +%Y%m%d_%H%M%S)
ORIGEN="/usr/share/nginx/html"
DESTINO="/backups"
ARCHIVO="mmstudio_backup_${FECHA}.tar.gz"
MAX_BACKUPS=7

mkdir -p "$DESTINO"

echo "============================================"
echo " M&M Studio - Script de backup"
echo " Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"

echo "[INFO] Origen:  $ORIGEN"
echo "[INFO] Destino: $DESTINO/$ARCHIVO"

# Crear backup comprimido
tar -czf "$DESTINO/$ARCHIVO" -C "$ORIGEN" . 2>/dev/null

if [ $? -eq 0 ]; then
    TAMANO=$(du -sh "$DESTINO/$ARCHIVO" | cut -f1)
    echo "[OK]   Backup completado: $ARCHIVO ($TAMANO)"

    # Eliminar backups antiguos (mantener solo los últimos MAX_BACKUPS)
    TOTAL=$(ls "$DESTINO"/mmstudio_backup_*.tar.gz 2>/dev/null | wc -l)
    if [ "$TOTAL" -gt "$MAX_BACKUPS" ]; then
        ELIMINAR=$((TOTAL - MAX_BACKUPS))
        ls -t "$DESTINO"/mmstudio_backup_*.tar.gz | tail -n "$ELIMINAR" | xargs rm -f
        echo "[INFO] Backups antiguos eliminados: $ELIMINAR archivo(s)"
    fi

    echo ""
    echo "[INFO] Backups disponibles ($MAX_BACKUPS máx.):"
    ls -lh "$DESTINO"/mmstudio_backup_*.tar.gz 2>/dev/null | awk '{print "       " $5 "  " $9}'
    echo "============================================"
    exit 0
else
    echo "[ERROR] El backup falló. Revisa permisos y espacio en disco."
    echo "============================================"
    exit 1
fi
