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
  chatgpt: chatgpt.prompt!,
  susan: susan.prompt!,
  damian: damian.prompt!,
  anthony: anthony.prompt!,
  steveJobs: steveJobs.prompt!
};

export {
  susan,
  damian,
  anthony,
  chatgpt,
  steveJobs
};
