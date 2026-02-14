#!/bin/bash

# Generate more realistic date-varied snapshots
# Each date gets a rotated/shuffled subset of articles

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
    # Get the day number to use as seed for rotation
    day_num=$(( ($current_seconds - $start_seconds) / 86400 ))
    offset=$(( day_num % 20 ))  # Rotate through 20-article windows
    
    # Create snapshot with:
    # 1. Rotated articles (different subset for each date)
    # 2. Updated publishedAt dates
    # 3. Shuffled order
    jq \
      --arg d "$current_date" \
      --argjson off "$offset" \
      '
      def shuffle:
        . as $array |
        [{value: ., key: (. | tostring | .[0:1] | ascii_downcase)}, {value: 1}] |
        sort_by(.key) |
        map(.value) |
        select(. != 1);
      
      {
        generatedAt: now | todate,
        filters: .filters,
        data: (
          .data |
          sort_by(.title) |
          [.[($off * 6) : ($off * 6 + 120)]] |
          map(
            select(. != null) |
            .publishedAt = ($d + "T" + (.publishedAt | split("T")[1]))
          ) |
          if length < 120 then
            . + ([.[] | .] | .[0:(120 - length)])
          else
            .
          end |
          sort_by(.publishedAt) |
          reverse
        )
      }
      ' live-sources-all.json > "$filename"
    echo "✓ Generated: $filename (offset: $offset)"
  fi
  
  day_count=$((day_count + 1))
  current_seconds=$((current_seconds + 86400))  # Add 1 day
done

echo ""
echo "✓ Total snapshots regenerated: $day_count"
ls -1 live-sources-2025-*.json live-sources-2026-*.json 2>/dev/null | wc -l
