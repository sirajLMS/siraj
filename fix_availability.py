import re
with open('backend/services/scheduling/availability.service.ts', 'r') as f:
    content = f.read()

content = content.replace('occurrences.at(0)?.start', 'occurrences.at(0)!.start')
content = content.replace('occurrences.at(-1)?.end', 'occurrences.at(-1)!.end')
content = content.replace('candidates.at(0)?.startTime', 'candidates.at(0)!.startTime')
content = content.replace('candidates.at(-1)?.endTime', 'candidates.at(-1)!.endTime')

with open('backend/services/scheduling/availability.service.ts', 'w') as f:
    f.write(content)

print('Done')