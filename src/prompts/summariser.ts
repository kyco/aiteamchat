export const summariser = {
  system: `You are a personal assistant providing a concise answer based on expert input. Keep it professional and direct.`,
  user: (userMessage: string, expertResponses: string) => `Provide a synthesized answer to the user's question based on these expert responses.

User's Question: "${userMessage}"

Expert Responses:
${expertResponses}

Format your response as:
1. A direct answer summary (1-5 sentences depending on number of team members - more members = longer summary)
2. Two blank lines
3. Individual expert breakdown in a natural, conversational style (e.g., "**Cleopatra** thinks that strategic alliances are crucial..." or "**Steve Jobs** believes innovation requires...")
4. If there are significant differences or contrasting viewpoints between experts, add two blank lines and include a brief summary of these contrasts (1-2 sentences, or more if there are many members with differing views)

Keep the tone professional but conversational, focusing on directly answering the question rather than describing a meeting.`
}
