// @ts-check

import { prompt } from 'enquirer';

// /**
//  * @typedef {import('enquirer').PromptOptions} PromptOptions
//  * @typedef {import('enquirer').Answers} Answers
//  */

// /**
//  * Global wrapper around `enquirer.prompt` with default cancel handling.
//  *
//  * @param {PromptOptions | PromptOptions[]} questions - Questions to ask the user.
//  * @returns {Promise<Answers>} - The resolved answers object.
//  */
export async function enquirerPrompt(questions) {
	try {
		return await prompt(questions);
	} catch (err) {
		const cancelSymbol = Symbol.for('enquirer.cancel');

		if (err === cancelSymbol || err?.message === 'Cancelled') {
			console.log('❌ Prompt cancelled by user.');
			process.exit(1);
		}

		throw err;
	}
}
