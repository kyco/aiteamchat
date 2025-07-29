import { susan } from './susan';
import { damian } from './damian';
import { anthony } from './anthony';
import { chatgpt } from './chatgpt';
import { steveJobs } from './steve-jobs';
import { ChatMember } from '../../types/chat';

export const defaultMembersData: ChatMember[] = [
  chatgpt,
  susan,
  damian,
  anthony,
  steveJobs
];

export const memberPromptsMap: Record<string, string> = {
  'system-default': chatgpt.prompt!,
  'system-project-manager': susan.prompt!,
  'system-senior-dev': damian.prompt!,
  'system-strategic-thinker': anthony.prompt!,
  'system-steve-jobs': steveJobs.prompt!
};

export {
  susan,
  damian,
  anthony,
  chatgpt,
  steveJobs
};
