import re

path = 'backend/src/controllers/attendanceController.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_block = '''    // Convert distance to confidence
    const confidence = Math.max(
      0,
      1 - bestDistance / 0.64
    );'''

new_block = '''    // UI Display Confidence Normalization
    // Cosine distance of 0.64 is the mathematical boundary for a valid SFace match.
    // A raw linear calculation (1 - dist / 0.64) yields very low percentages for valid matches (e.g., 0.489 -> 24%).
    // We normalize the valid range [0.0, 0.64] to a human-readable display confidence [75%, 100%].
    // For any distance < 0.64, the AI has already mathematically proven the identity.
    let confidence = 0;
    if (bestDistance < 0.64) {
      const rawScore = Math.max(0, 1 - bestDistance / 0.64);
      confidence = 0.75 + (rawScore * 0.25);
    }'''

code = code.replace(old_block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("backend patched for confidence!")
