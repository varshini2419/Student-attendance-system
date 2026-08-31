import re

path = 'backend/src/controllers/attendanceController.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_block = '''    // FACE MATCH THRESHOLD: 50%
    const MATCH_THRESHOLD =
      parseFloat(process.env.MATCH_THRESHOLD) || 0.50;

    if (confidence < MATCH_THRESHOLD) {
      const thresholdPercent = Math.round(
        MATCH_THRESHOLD * 100
      );

      return res.status(200).json({
        faceDetected: true,
        matched: false,
        confidence,
        message: `Face match is below ${thresholdPercent}%. Please align your face and try again.`
      });
    }'''

new_block = '''    // Harmonized Face Recognition Pipeline
    // The AI has already verified the match using the mathematically correct cosine distance threshold (0.64).
    // We will no longer overwrite a valid AI match with a contradictory secondary percentage threshold.
    // The confidence percentage is preserved purely as a UI metric.
    /*
    const MATCH_THRESHOLD = parseFloat(process.env.MATCH_THRESHOLD) || 0.50;
    if (confidence < MATCH_THRESHOLD) { ... }
    */'''

code = code.replace(old_block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("backend patched!")
