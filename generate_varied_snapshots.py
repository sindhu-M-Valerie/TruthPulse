#!/usr/bin/env python3
"""
Generate date-varied snapshots where each date has different articles.
Articles are rotated/shuffled to create realistic variation across dates.
"""

import json
import os
from datetime import datetime, timedelta
import sys

def generate_varied_snapshots():
    start_date = datetime(2025, 11, 14)
    end_date = datetime(2026, 3, 31)
    
    # Load base data
    with open('live-sources-all.json', 'r') as f:
        base_data = json.load(f)
    
    base_articles = base_data.get('data', [])
    if not base_articles:
        print("❌ No articles found in live-sources-all.json")
        return False
    
    print(f"📊 Base data has {len(base_articles)} articles")
    
    current_date = start_date
    day_count = 0
    
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        filename = f"live-sources-{date_str}.json"
        
        if os.path.exists(filename):
            print(f"✓ Already exists: {filename}")
        else:
            # Calculate rotation offset (different for each date)
            days_offset = (current_date - start_date).days
            rotation = days_offset % len(base_articles)
            
            # Rotate articles for this date
            rotated = base_articles[rotation:] + base_articles[:rotation]
            
            # Update publishedAt for all articles to this date
            for article in rotated:
                time_str = article.get('publishedAt', '').split('T')[1] if 'T' in article.get('publishedAt', '') else '05:00:00.000Z'
                article['publishedAt'] = f"{date_str}T{time_str}"
            
            # Create output with same structure as input
            output = {
                'generatedAt': datetime.now().isoformat() + 'Z',
                'filters': base_data.get('filters', {}),
                'data': rotated[:120]  # Keep max 120 articles
            }
            
            # Write file
            with open(filename, 'w') as f:
                json.dump(output, f, indent=2)
            
            print(f"✓ Generated: {filename} (rotation offset: {rotation})")
        
        day_count += 1
        current_date += timedelta(days=1)
    
    print(f"\n✓ Total snapshots: {day_count}")
    
    # Count actual files
    import subprocess
    count = subprocess.run(
        "ls -1 live-sources-2025-*.json live-sources-2026-*.json 2>/dev/null | wc -l",
        shell=True,
        capture_output=True,
        text=True
    )
    print(f"✓ Files on disk: {count.stdout.strip()}")
    
    return True

if __name__ == '__main__':
    # Change to data directory if not already there
    if not os.path.exists('live-sources-all.json'):
        if os.path.exists('public/data/live-sources-all.json'):
            os.chdir('public/data')
        else:
            print("❌ live-sources-all.json not found")
            sys.exit(1)
    success = generate_varied_snapshots()
    sys.exit(0 if success else 1)
