// @ts-check

import { dirname, join } from 'path';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
	appendFileSync,
} from 'fs';
import progressEstimator from 'progress-estimator';
import { cwd } from 'process';

/**
 * * Walks up from the current directory to find the project root (containing `package.json`).
 *
 * @param {string} fromDir Starting directory
 * @returns {string} Directory path containing package.json
 */
function findProjectRoot(fromDir) {
	let currentDir = fromDir;

	while (!existsSync(join(currentDir, 'package.json'))) {
		const parentDir = dirname(currentDir);
		if (parentDir === currentDir) break;
		currentDir = parentDir;
	}

	return currentDir;
}

const projectRoot = findProjectRoot(cwd());
const estimatorDir = join(projectRoot, '.estimator');

// Ensure `.estimator` directory exists
if (!existsSync(estimatorDir)) {
	mkdirSync(estimatorDir, { recursive: true });
}

// Ensure `.gitignore` contains `.estimator`
const gitignorePath = join(projectRoot, '.gitignore');

if (!existsSync(gitignorePath)) {
	writeFileSync(gitignorePath, `.estimator\n`);
} else {
	const contents = readFileSync(gitignorePath, 'utf8');
	if (!contents.includes('.estimator')) {
		appendFileSync(gitignorePath, `\n.estimator\n`);
	}
}

/**
 * * An instance of the progress-estimator used to log progress for long-running tasks.
 *
 * Uses a `.estimator` directory in the project root to store timing metadata,
 * which helps in providing more accurate estimates in subsequent runs.
 *
 * @type {progressEstimator.ProgressEstimator}
 */
export const estimator = progressEstimator({
	storagePath: estimatorDir,
});
