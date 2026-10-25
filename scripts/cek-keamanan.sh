#!/usr/bin/env bash
# Ringkasan keamanan VPS untuk dibaca pemilik: percobaan login SSH, login yang berhasil, port terbuka, update, dan container.
# Jalankan di VPS: bash ~/majalengka.tech/scripts/cek-keamanan.sh [jam]   (default 24 jam terakhir)
set -uo pipefail

HOURS="${1:-24}"
LOG=$(sudo journalctl -u ssh --since "$HOURS hours ago" --no-pager -o cat 2>/dev/null)

echo "== Percobaan login SSH gagal, $HOURS jam terakhir =="
echo "Total: $(echo "$LOG" | grep -cE 'Invalid user|Connection closed by authenticating|Disconnected from authenticating')"
echo
echo "IP paling sering mencoba:"
echo "$LOG" | grep -oE '(user \S+|authenticating user \S+) [0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort | uniq -c | sort -rn | head -10
echo
echo "Username yang dicoba:"
echo "$LOG" | grep -oE 'Invalid user \S+' | awk '{print $3}' | sort | uniq -c | sort -rn | head -10
echo
echo "== Login SSH yang BERHASIL (periksa: semua harus dari IP kamu) =="
echo "$LOG" | grep -oE 'Accepted \S+ for \S+ from \S+' | awk '{print "cara=" $2, "user=" $4, "dari=" $6}' | sort | uniq -c | sort -rn | head -10
echo
if systemctl is-active --quiet fail2ban; then
	echo "== IP yang sedang diblokir fail2ban =="
	sudo fail2ban-client status sshd 2>/dev/null | grep -E 'Currently banned|Total banned|Banned IP'
	echo
fi
echo "== Port yang mendengarkan di semua alamat (selain localhost) =="
sudo ss -ltnpH | awk '$4 !~ /^(127\.|\[::1\])/ {print $4, $6}'
echo
echo "== Update sistem =="
echo "Paket menunggu update: $(apt list --upgradable 2>/dev/null | tail -n +2 | wc -l)"
[ -f /var/run/reboot-required ] && echo "Perlu restart: kernel baru $(ls /boot/vmlinuz-* | sort -V | tail -1 | sed 's|/boot/vmlinuz-||') belum dipakai (sekarang $(uname -r))"
echo
echo "== Container =="
docker ps --format '{{.Names}}  {{.Status}}  {{.Ports}}'
echo
echo "== Cadangan database terakhir =="
ls -t "$HOME"/majalengka.tech/.data/backups/sqlite-*.db.gz 2>/dev/null | head -3 || echo "Belum ada cadangan."
