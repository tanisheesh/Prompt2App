
'use server';

/**
 * @fileOverview This file defines a Genkit flow that generates a Next.js web app based on a natural language prompt.
 *
 * - generateApp - A function that accepts a prompt and returns the generated app code.
 * - GenerateAppInput - The input type for the generateApp function.
 * - GenerateAppOutput - The return type for the generateApp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAppInputSchema = z.object({
  prompt: z.string().describe('A natural language description of the desired web app.'),
});
export type GenerateAppInput = z.infer<typeof GenerateAppInputSchema>;

const GenerateAppOutputSchema = z.object({
  code: z.string().describe('The generated HTML code for the app preview.'),
});
export type GenerateAppOutput = z.infer<typeof GenerateAppOutputSchema>;

export async function generateApp(input: GenerateAppInput): Promise<GenerateAppOutput> {
  return generateAppFlow(input);
}

const generateAppPrompt = ai.definePrompt({
  name: 'generateAppPrompt',
  input: {schema: GenerateAppInputSchema},
  output: {schema: GenerateAppOutputSchema},
  prompt: `You are an expert and imaginative AI web app developer. Your primary goal is to understand the *essence* of the user's request and generate a **fully functional, single-page web application** that not only meets the literal description but also anticipates and incorporates features that would make it a truly useful and well-designed app for the user. Think creatively and leverage your knowledge to build the best possible version of the app the user is imagining. This application will be embedded directly into an iframe using the \`srcdoc\` attribute, so it MUST be a single HTML file containing all necessary HTML, inline CSS, and inline JavaScript.

User Description: {{{prompt}}}

**Key Requirements for the Generated App:**
1.  **Functionality over Mockup:** The app should work as described. If the user asks for "a daily planner with voice reminders," the generated app must allow users to add tasks, set times, and **actually play voice reminders** at the set times using browser APIs like \`window.speechSynthesis\` and \`SpeechSynthesisUtterance\`.
2.  **Self-Contained:** All code (HTML, CSS, JavaScript) must be within the single HTML file. No external file references beyond absolute URLs for placeholder images (e.g., \`https://placehold.co/300x200.png\`).
3.  **Vanilla JavaScript & Browser APIs:** Use standard HTML5, CSS3, and vanilla JavaScript. Do not use any frameworks (React, Vue, Angular, etc.) or libraries unless their code can be fully inlined and is very concise. Prioritize direct use of browser APIs.
4.  **User Interface:**
    *   Create a clear, usable, and **highly interactive** user interface.
    *   Design a **visually appealing, colorful, and eye-catchy** layout. Make it modern and engaging.
    *   Select a **color palette and design elements that are contextually appropriate** for the app's purpose. Consider common design patterns and aesthetics from similar real-life applications to inform your choices. The goal is to make the app not just functional but also aesthetically pleasing and modern.
    *   Ensure the interface is **mobile-friendly and responsive**.
5.  **Error Handling (Basic):** Include basic error handling or feedback where appropriate (e.g., if the browser doesn't support a required API).
6.  **No Server-Side Code:** The generated code must be entirely client-side.
7.  **Output Format:** The 'code' field in your output JSON must contain ONLY the complete HTML string.

**Example Scenario for "a daily planner with voice reminders":**
   - The HTML should allow adding tasks with descriptions and due times (e.g., using \`<input type="datetime-local">\`).
   - JavaScript should manage these tasks, perhaps in an array of objects.
   - JavaScript should regularly check (e.g., using \`setInterval\`) if any task's due time has been reached.
   - When a task's due time is reached, JavaScript should use \`window.speechSynthesis.speak(new SpeechSynthesisUtterance('Reminder for your task: [task description]'))\` to provide an audible reminder.
   - The app should clearly indicate active reminders or upcoming tasks with an appealing visual design.
   - Consider providing a way to dismiss or mark tasks as complete.
   - Handle potential issues, like the browser not supporting speech synthesis, by providing a text fallback (e.g., an alert or a message on the page).
   - Persisting tasks (e.g., using \`localStorage\`) is a bonus if it can be implemented cleanly within the single file.

Generate the HTML code that brings the user's description to life as a working application preview. Ensure the JavaScript is robust enough to handle the described functionality and the CSS makes the app visually stunning and appropriate for its purpose.
`,
});

const generateAppFlow = ai.defineFlow(
  {
    name: 'generateAppFlow',
    inputSchema: GenerateAppInputSchema,
    outputSchema: GenerateAppOutputSchema,
  },
  async input => {
    const {output} = await generateAppPrompt(input);
    return output!;
  }
);
