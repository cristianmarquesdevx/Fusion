#!/usr/bin/env python3
"""Fix remaining broken encoding in dashboard.html."""

with open('dashboard.html', 'rb') as f:
    data = f.read()

# Fix remaining broken chars
remaining = [
    # Line 2153: trailing "��" -> "..."
    (b'pontua\xc3\xa7\xc3\xa3o\xef\xbf\xbd\xef\xbf\xbd', b'pontua\xc3\xa7\xc3\xa3o...'),
    
    # Line 2241: "Informa�e�es adicionais��" -> "Informações adicionais..."
    (b'Informa\xef\xbf\xbde\xef\xbf\xbdes', b'Informa\xc3\xa7\xc3\xb5es'),
    (b'Informa\xc3\xa7\xc3\xb5es adicionais\xef\xbf\xbd\xef\xbf\xbd', b'Informa\xc3\xa7\xc3\xb5es adicionais...'),
]

for old, new in remaining:
    if old in data:
        data = data.replace(old, new)
        print(f"✓ Replaced: {old[:50]}")
    else:
        print(f"✗ Not found: {old[:50]}")

# Final count
remaining_count = data.count(b'\xef\xbf\xbd')
print(f"\nRemaining U+FFFD characters: {remaining_count}")

with open('dashboard.html', 'wb') as f:
    f.write(data)
print("Done!")
