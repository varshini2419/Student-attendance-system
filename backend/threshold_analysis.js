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
  
  const genuineDistances = [];
  const impostorDistances = [];
  
  // Registration Quality
  console.log("=== REGISTRATION QUALITY ===");
  for (const s of students) {
    let maxD = 0;
    let minD = 1.0;
    let sumD = 0;
    let count = 0;
    
    if (s.embeddings.length > 1) {
      for (let i = 0; i < s.embeddings.length; i++) {
        for (let j = i + 1; j < s.embeddings.length; j++) {
          const d = cosineDistance(s.embeddings[i], s.embeddings[j]);
          genuineDistances.push(d);
          if (d > maxD) maxD = d;
          if (d < minD) minD = d;
          sumD += d;
          count++;
        }
      }
      const avg = count > 0 ? sumD / count : 0;
      let status = "GOOD";
      if (maxD > 0.45) status = "INVALID";
      else if (maxD > 0.3) status = "QUESTIONABLE";
      
      console.log(`Student: ${s.name} | RegImages: ${s.embeddings.length} | Range: ${minD.toFixed(4)}-${maxD.toFixed(4)} | Avg: ${avg.toFixed(4)} | Max: ${maxD.toFixed(4)} | Status: ${status}`);
    } else {
      console.log(`Student: ${s.name} | RegImages: ${s.embeddings.length} | Status: QUESTIONABLE (Only 1 image)`);
    }
  }

  // Cross-Student (Impostor) Distances
  for (let i = 0; i < students.length; i++) {
    for (let j = i + 1; j < students.length; j++) {
      let minD = 1.0;
      for (const e1 of students[i].embeddings) {
        for (const e2 of students[j].embeddings) {
          const d = cosineDistance(e1, e2);
          impostorDistances.push(d);
          if (d < minD) minD = d;
        }
      }
    }
  }

  console.log("\n=== THRESHOLD ANALYSIS ===");
  const thresholds = [0.35, 0.40, 0.42, 0.45, 0.50, 0.55, 0.60, 0.64];
  console.log("Threshold | Genuine Accepted | Genuine Rejected | False Positives | False Positive Rate");
  for (const t of thresholds) {
    let genAcc = 0, genRej = 0;
    let falsePos = 0;
    
    for (const d of genuineDistances) {
      if (d <= t) genAcc++;
      else genRej++;
    }
    
    for (const d of impostorDistances) {
      if (d <= t) falsePos++;
    }
    
    const fpr = impostorDistances.length > 0 ? (falsePos / impostorDistances.length) * 100 : 0;
    
    console.log(`${t.toFixed(2)}      | ${genAcc.toString().padEnd(16)} | ${genRej.toString().padEnd(16)} | ${falsePos.toString().padEnd(15)} | ${fpr.toFixed(2)}%`);
  }

  // Genuine Stats
  if (genuineDistances.length > 0) {
    const minG = Math.min(...genuineDistances);
    const maxG = Math.max(...genuineDistances);
    const avgG = genuineDistances.reduce((a, b) => a + b, 0) / genuineDistances.length;
    console.log(`\nGenuine Distances - Min: ${minG.toFixed(4)}, Avg: ${avgG.toFixed(4)}, Max: ${maxG.toFixed(4)}`);
  }
  
  if (impostorDistances.length > 0) {
    const minI = Math.min(...impostorDistances);
    const maxI = Math.max(...impostorDistances);
    const avgI = impostorDistances.reduce((a, b) => a + b, 0) / impostorDistances.length;
    console.log(`Impostor Distances - Min: ${minI.toFixed(4)}, Avg: ${avgI.toFixed(4)}, Max: ${maxI.toFixed(4)}`);
  }

  process.exit(0);
}

analyze();
