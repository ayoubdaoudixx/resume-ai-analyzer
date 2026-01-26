import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.resolve(__dirname, "job_matcher.py");
const pythonBin = process.env.PYTHON_BIN || "python3";

export function runJobMatcher({ searchQuery, resumeText }) {
    return new Promise((resolve, reject) => {
        if (!searchQuery || !resumeText) {
            resolve([]);
            return;
        }

        const args = [scriptPath, searchQuery, resumeText];
        const child = spawn(pythonBin, args, {
            env: process.env,
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("error", (error) => {
            reject(error);
        });

        child.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(stderr.trim() || "Python job matcher failed"));
                return;
            }

            const output = stdout.trim();
            if (!output) {
                resolve([]);
                return;
            }

            try {
                resolve(JSON.parse(output));
            } catch (error) {
                reject(
                    new Error(
                        `Failed to parse job matcher output: ${error instanceof Error ? error.message : "unknown error"}`
                    )
                );
            }
        });
    });
}
