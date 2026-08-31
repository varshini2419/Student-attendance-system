const mongoose = require('mongoose');

const cosineDistance = (v1, v2) => {
  let dotProduct = 0.0;
  let norm1 = 0.0;
  let norm2 = 0.0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }
  if (norm1 === 0 || norm2 === 0) return 1.0;
  return 1.0 - dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

async function analyze() {
  await mongoose.connect('mongodb+srv://varshini2419_db_user:varshi123@cluster0.yje3tca.mongodb.net/?appName=Cluster0');
  const Student = mongoose.connection.collection('students');
  const students = await Student.find({ embeddings: { $exists: true, $not: { $size: 0 } } }).toArray();
  
  console.log(`Found ${students.length} students with embeddings.`);
  
  for (let i = 0; i < students.length; i++) {
    for (let j = i + 1; j < students.length; j++) {
      let minDistance = 1.0;
      for (const emb1 of students[i].embeddings) {
        for (const emb2 of students[j].embeddings) {
          const d = cosineDistance(emb1, emb2);
          if (d < minDistance) minDistance = d;
        }
      }
      if (minDistance < 0.64) {
         console.log(`[WARNING] False Positive Risk: ${students[i].name} and ${students[j].name} have distance ${minDistance.toFixed(4)} (< 0.64)`);
      } else if (minDistance < 0.70) {
         console.log(`[INFO] Close Match: ${students[i].name} and ${students[j].name} have distance ${minDistance.toFixed(4)}`);
      }
    }
  }
  
  // Also check intra-student distances (quality of registration)
  for (const student of students) {
      if (student.embeddings.length > 1) {
          let maxDist = 0;
          for (let i = 0; i < student.embeddings.length; i++) {
              for (let j = i + 1; j < student.embeddings.length; j++) {
                  const d = cosineDistance(student.embeddings[i], student.embeddings[j]);
                  if (d > maxDist) maxDist = d;
              }
          }
          console.log(`[QUALITY] ${student.name} max intra-distance (between their own pics): ${maxDist.toFixed(4)}`);
      }
  }
  
  process.exit(0);
}

analyze();
