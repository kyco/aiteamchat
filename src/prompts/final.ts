export const final = (userMessage:string, expertResponses:string) => `You are tasked with creating a unified summary of multiple expert responses to a user's question.

User's Question: "${userMessage}"

Expert Responses:
${expertResponses}

Please create a comprehensive, unbiased summary that:
1. Synthesizes the key insights from all experts
2. Highlights common themes and different perspectives
3. Provides actionable recommendations
4. Maintains a balanced view without favoring any particular expert

Format your response as a well-structured summary with clear sections.`;
