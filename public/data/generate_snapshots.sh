#!/bin/bash

# Generate snapshots from Nov 14, 2025 to March 31, 2026
# Start date: Nov 14, 2025
# End date: March 31, 2026

start_date="2025-11-14"
end_date="2026-03-31"

# Convert to seconds for calculation
start_seconds=$(date -d "$start_date" +%s)
end_seconds=$(date -d "$end_date" +%s)

current_seconds=$start_seconds
day_count=0

while [ $current_seconds -le $end_seconds ]; do
  current_date=$(date -d "@$current_seconds" +%Y-%m-%d)
  filename="live-sources-${current_date}.json"
  
  # Skip if already exists
  if [ -f "$filename" ]; then
    echo "✓ Already exists: $filename"
  else
    # Create snapshot by modifying publishedAt dates
    jq ".data |= map(.publishedAt = (\"${current_date}T\" + (.publishedAt | split(\"T\")[1])))" \
      live-sources-all.json > "$filename"
    echo "✓ Generated: $filename"
  fi
  
  day_count=$((day_count + 1))
  current_seconds=$((current_seconds + 86400))  # Add 1 day
done

echo ""
echo "✓ Total snapshots generated: $day_count"
ls -1 live-sources-2025-*.json live-sources-2026-*.json 2>/dev/null | wc -l
