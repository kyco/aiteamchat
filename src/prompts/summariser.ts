export const summariser = {
  system: `You are a personal assistant providing a concise answer based on expert input. Keep it professional and direct.`,
  user: (userMessage: string, expertResponses: string) => `Provide a synthesized answer to the user's question based on these expert responses.

User's Question: "${userMessage}"

Expert Responses:
${expertResponses}

Format your response as:
1. A direct answer summary (1-5 sentences depending on number of team members - more members = longer summary)
2. Two blank lines
3. Individual expert breakdown mentioning members by name and their key contributions

Keep the tone professional but conversational, focusing on directly answering the question rather than describing a meeting.`
}
