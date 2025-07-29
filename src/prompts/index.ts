import { memberPromptsMap } from '../data/members/index';
import { summariser } from './summariser';
import { bulletPoints } from './bullet-points';
import { roleGenerator } from './role-generator';
import { descriptionGenerator } from './description-generator';

export const prompts = {
  chatgpt: memberPromptsMap['system-default'],
  susan: memberPromptsMap['system-project-manager'],
  damian: memberPromptsMap['system-senior-dev'],
  anthony: memberPromptsMap['system-strategic-thinker'],
  steveJobs: memberPromptsMap['system-steve-jobs'],
  summariser,
  bulletPoints,
  roleGenerator,
  descriptionGenerator,
};
