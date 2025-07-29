export const summariser = {
  system: `You are an expert at synthesizing multiple perspectives into a clear, actionable summary.`,
  user: (userMessage: string, expertResponses: string) => `You are tasked with creating a unified summary of multiple expert responses to a user's question.

User's Question: "${userMessage}"

Expert Responses:
${expertResponses}

If all expert responses are more or less the same simply reply with the one that is the shortest and most friendly sounding. If there are distinguishable differences then create a summary of maximum 3 sentences without favoring any particular expert. Do not unnecessairly mention the experts and their role. Refer to them as "team" and keep the tone of the summary easy to understand, do not be verbose.`
}
