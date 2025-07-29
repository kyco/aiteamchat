import { memberPromptsMap } from '../data/members/index';
import { summariser } from './summariser';
import { bulletPoints } from './bullet-points';
import { roleGenerator } from './role-generator';
import { descriptionGenerator } from './description-generator';

export const prompts = {
  chatgpt: memberPromptsMap.chatgpt,
  susan: memberPromptsMap.susan,
  damian: memberPromptsMap.damian,
  anthony: memberPromptsMap.anthony,
  steveJobs: memberPromptsMap.steveJobs,
  summariser,
  bulletPoints,
  roleGenerator,
  descriptionGenerator,
};
