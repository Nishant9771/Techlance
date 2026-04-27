import { exec } from "child_process";
import * as fs from "fs";

interface FraudInput {
  cancellations: number;
  disputes: number;
  completion_rate: number;
  response_time: number;
  message_repeat: number;
}

export const detectFraudML = (input: FraudInput): Promise<any> => {
  return new Promise((resolve, reject) => {

    // 🔥 WRITE INPUT TO FILE
    fs.writeFileSync("ml/scripts/input.json", JSON.stringify(input));

    const command = `python "ml/scripts/predict.py"`;

    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);

      try {
        const result = JSON.parse(stdout);

        resolve({
          fraudProbability: result.fraudProbability,
          isFraud: result.fraudProbability > 0.6,
          level:
            result.fraudProbability > 0.8
              ? "HIGH"
              : result.fraudProbability > 0.5
              ? "MEDIUM"
              : "LOW",
        });
      } catch (e) {
        reject(e);
      }
    });
  });
};